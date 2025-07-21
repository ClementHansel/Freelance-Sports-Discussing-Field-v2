import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ModerationAppealRequest {
  contentId: string;
  contentType: 'post' | 'topic';
  reason: string;
  userEmail?: string;
  userName?: string;
  contentUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Moderation appeal function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { contentId, contentType, reason, userEmail, userName, contentUrl }: ModerationAppealRequest = await req.json();

    console.log("Processing moderation appeal:", { contentId, contentType, userEmail });

    // Validate required fields
    if (!contentId || !contentType || !reason) {
      return new Response(
        JSON.stringify({ error: "Content ID, type, and reason are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get content details from database
    const tableName = contentType === 'post' ? 'posts' : 'topics';
    const { data: content, error: contentError } = await supabase
      .from(tableName)
      .select(`
        *,
        ${contentType === 'post' ? 'topic:topics(title, slug, category:categories(name, slug))' : 'category:categories(name, slug)'}
      `)
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      console.error('Error fetching content:', contentError);
      return new Response(
        JSON.stringify({ error: "Content not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get moderation history for this content
    const { data: moderationHistory } = await supabase
      .from('moderation_history')
      .select(`
        *,
        moderator:profiles(username)
      `)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .order('created_at', { ascending: false });

    const lastApproval = moderationHistory?.find(h => h.new_status === 'approved' && h.moderator_id);

    // Store the appeal in database
    const { error: appealError } = await supabase
      .from('moderation_appeals')
      .insert({
        content_id: contentId,
        content_type: contentType,
        appellant_email: userEmail,
        appeal_reason: reason,
        content_context: JSON.stringify({
          title: contentType === 'post' ? content.topic?.title : content.title,
          content: content.content,
          url: contentUrl,
          category: contentType === 'post' ? content.topic?.category?.name : content.category?.name
        })
      });

    if (appealError) {
      console.error('Error storing appeal:', appealError);
    }

    // Prepare email content
    const contentTitle = contentType === 'post' ? content.topic?.title : content.title;
    const categoryName = contentType === 'post' ? content.topic?.category?.name : content.category?.name;
    
    // Send email to admin
    const adminEmailResponse = await resend.emails.send({
      from: "Minor Hockey Talks <noreply@minorhockeytalks.com>",
      to: ["minorhockeytalks@gmail.com"],
      subject: `Moderation Appeal: ${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Content Review Request`,
      html: `
        <h2>Moderation Appeal Submitted</h2>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Appeal Details</h3>
          <p><strong>Content Type:</strong> ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}</p>
          <p><strong>Content Title:</strong> ${contentTitle || 'No title'}</p>
          <p><strong>Category:</strong> ${categoryName || 'Unknown'}</p>
          <p><strong>Reporter:</strong> ${userName || 'Anonymous'} ${userEmail ? `(${userEmail})` : ''}</p>
          ${contentUrl ? `<p><strong>Content URL:</strong> <a href="${contentUrl}">${contentUrl}</a></p>` : ''}
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Reason for Appeal</h3>
          <p style="white-space: pre-wrap;">${reason}</p>
        </div>

        <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Content Preview</h3>
          <p style="white-space: pre-wrap; max-height: 200px; overflow-y: auto;">${content.content || 'No content'}</p>
        </div>

        ${lastApproval ? `
        <div style="background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Previous Moderation</h3>
          <p><strong>Approved by:</strong> ${lastApproval.moderator?.username || 'Unknown moderator'}</p>
          <p><strong>Approved on:</strong> ${new Date(lastApproval.created_at).toLocaleDateString()}</p>
          <p><strong>Reason:</strong> ${lastApproval.reason || 'No reason provided'}</p>
        </div>
        ` : ''}

        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Moderation History</h3>
          ${moderationHistory?.map(h => `
            <p><strong>${new Date(h.created_at).toLocaleDateString()}:</strong> 
            ${h.old_status || 'new'} → ${h.new_status} 
            ${h.moderator?.username ? `by ${h.moderator.username}` : '(automatic)'}
            ${h.reason ? `- ${h.reason}` : ''}</p>
          `).join('') || '<p>No moderation history found</p>'}
        </div>

        <hr>
        <p style="color: #666; font-size: 12px;">
          This appeal was submitted through the Minor Hockey Talks moderation system.
          Please review the content and respond appropriately.
        </p>
      `,
    });

    console.log("Admin email sent successfully:", adminEmailResponse);

    // Send confirmation email to user if email provided
    let userEmailResponse = null;
    if (userEmail) {
      userEmailResponse = await resend.emails.send({
        from: "Minor Hockey Talks <noreply@minorhockeytalks.com>",
        to: [userEmail],
        subject: "Moderation Appeal Received",
        html: `
          <h2>Thank you for your appeal, ${userName || 'User'}!</h2>
          
          <p>We have received your appeal regarding content that was previously reviewed and approved by our moderation team.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>Appeal Summary</h3>
            <p><strong>Content:</strong> ${contentTitle || 'Forum content'}</p>
            <p><strong>Your concern:</strong></p>
            <p style="white-space: pre-wrap; background: white; padding: 10px; border-radius: 3px;">${reason}</p>
          </div>
          
          <p>Our moderation team will review your appeal and the content in question. We will respond within 24-48 hours with our decision.</p>
          
          <p>We appreciate your help in keeping our community safe and following our guidelines.</p>
          
          <p>Best regards,<br>
          The Minor Hockey Talks Moderation Team</p>
          
          <hr>
          <p style="color: #666; font-size: 12px;">
            This is an automated confirmation email. Please do not reply to this message.
          </p>
        `,
      });

      console.log("User confirmation email sent successfully:", userEmailResponse);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Appeal submitted successfully",
        adminEmailId: adminEmailResponse.data?.id,
        userEmailId: userEmailResponse?.data?.id
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-moderation-appeal function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to submit appeal", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);