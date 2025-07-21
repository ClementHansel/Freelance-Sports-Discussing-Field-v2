import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block"
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Security validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && !email.includes('<') && !email.includes('>');
};

const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>\"\'&]/g, '') // Remove potentially dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
};

const validateInputLengths = (data: ContactEmailRequest): string | null => {
  if (data.name.length > 100) return "Name must be less than 100 characters";
  if (data.email.length > 320) return "Email must be less than 320 characters"; // RFC standard
  if (data.subject.length > 200) return "Subject must be less than 200 characters";
  if (data.message.length > 2000) return "Message must be less than 2000 characters";
  return null;
};

const logSecurityEvent = (event: string, details: any, clientIP?: string) => {
  console.log(`SECURITY_EVENT: ${event}`, {
    timestamp: new Date().toISOString(),
    event,
    details,
    clientIP,
    userAgent: details.userAgent || 'unknown'
  });
};

const handler = async (req: Request): Promise<Response> => {
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  console.log("Contact email function called from IP:", clientIP);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    logSecurityEvent("INVALID_METHOD", { method: req.method }, clientIP);
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const requestData = await req.json();
    
    // Enhanced input validation
    if (typeof requestData !== 'object' || requestData === null) {
      logSecurityEvent("INVALID_JSON_STRUCTURE", { data: requestData }, clientIP);
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { name, email, subject, message }: ContactEmailRequest = requestData;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      logSecurityEvent("MISSING_REQUIRED_FIELDS", { 
        hasName: !!name, hasEmail: !!email, hasSubject: !!subject, hasMessage: !!message 
      }, clientIP);
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate input lengths
    const lengthValidationError = validateInputLengths({ name, email, subject, message });
    if (lengthValidationError) {
      logSecurityEvent("INPUT_LENGTH_VIOLATION", { error: lengthValidationError }, clientIP);
      return new Response(
        JSON.stringify({ error: lengthValidationError }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format and check for injection attempts
    if (!validateEmail(email)) {
      logSecurityEvent("INVALID_EMAIL_FORMAT", { email: email.substring(0, 20) + '...' }, clientIP);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize all inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedSubject = sanitizeInput(subject);
    const sanitizedMessage = sanitizeInput(message);

    // Check for suspicious patterns that might indicate injection attempts
    const suspiciousPatterns = [
      /bcc:/i, /cc:/i, /to:/i, /from:/i, // Email header injection
      /<script/i, /javascript:/i, /vbscript:/i, // XSS attempts
      /\r\n/g, /\n\r/g, /\r/g, /\n/g // CRLF injection attempts in email context
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(name) || pattern.test(subject) || pattern.test(message)) {
        logSecurityEvent("SUSPICIOUS_CONTENT_DETECTED", { 
          pattern: pattern.toString(),
          userAgent 
        }, clientIP);
        return new Response(
          JSON.stringify({ error: "Invalid content detected" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    console.log("Processing contact form submission:", { 
      name: sanitizedName.substring(0, 20) + '...', 
      email: email.substring(0, 20) + '...', 
      subject: sanitizedSubject.substring(0, 30) + '...' 
    });

    // Send email to admin with sanitized content
    const adminEmailResponse = await resend.emails.send({
      from: "Minor Hockey Talks <noreply@minorhockeytalks.com>",
      to: ["minorhockeytalks@gmail.com"],
      subject: `Contact Form: ${sanitizedSubject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${sanitizedName} (${email})</p>
        <p><strong>Subject:</strong> ${sanitizedSubject}</p>
        <p><strong>Client IP:</strong> ${clientIP}</p>
        <p><strong>User Agent:</strong> ${userAgent}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${sanitizedMessage.replace(/\n/g, '<br>')}
        </div>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This message was sent through the Minor Hockey Talks contact form.
          Timestamp: ${new Date().toISOString()}
        </p>
      `,
    });

    console.log("Admin email sent successfully:", adminEmailResponse);

    // Send confirmation email to user with sanitized content
    const userEmailResponse = await resend.emails.send({
      from: "Minor Hockey Talks <noreply@minorhockeytalks.com>",
      to: [email],
      subject: "We received your message!",
      html: `
        <h2>Thank you for contacting us, ${sanitizedName}!</h2>
        <p>We have received your message with the subject: <strong>"${sanitizedSubject}"</strong></p>
        <p>Our team will review your message and get back to you as soon as possible, typically within 24-48 hours.</p>
        
        <h3>Your Message:</h3>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${sanitizedMessage.replace(/\n/g, '<br>')}
        </div>
        
        <p>If you have any urgent concerns or need immediate assistance, please don't hesitate to reach out to us through our community forums.</p>
        
        <p>Best regards,<br>
        The Minor Hockey Talks Team</p>
        
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated confirmation email. Please do not reply to this message.
          Reference ID: ${adminEmailResponse.data?.id || 'N/A'}
        </p>
      `,
    });

    console.log("User confirmation email sent successfully:", userEmailResponse);

    // Log successful email send
    logSecurityEvent("EMAIL_SENT_SUCCESS", {
      adminEmailId: adminEmailResponse.data?.id,
      userEmailId: userEmailResponse.data?.id
    }, clientIP);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        reference: adminEmailResponse.data?.id || 'N/A'
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
    // Log security events for different error types
    if (error.name === 'SyntaxError') {
      logSecurityEvent("JSON_PARSE_ERROR", { error: error.message }, clientIP);
    } else if (error.message?.includes('rate') || error.message?.includes('limit')) {
      logSecurityEvent("RATE_LIMIT_EXCEEDED", { error: error.message }, clientIP);
    } else {
      logSecurityEvent("UNEXPECTED_ERROR", { 
        error: error.message,
        stack: error.stack?.substring(0, 200) 
      }, clientIP);
    }

    console.error("Error in send-contact-email function:", error);
    
    // Don't expose internal error details to client
    return new Response(
      JSON.stringify({ 
        error: "An error occurred while processing your request. Please try again later.",
        reference: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);