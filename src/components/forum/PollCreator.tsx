import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { X, Plus, BarChart3 } from 'lucide-react';
import { CreatePollData } from '@/hooks/useCreatePoll';

interface PollCreatorProps {
  onCreatePoll: (pollData: CreatePollData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PollCreator: React.FC<PollCreatorProps> = ({ 
  onCreatePoll, 
  onCancel, 
  isLoading = false 
}) => {
  const [pollData, setPollData] = useState<CreatePollData>({
    question: '',
    description: '',
    options: ['', ''],
    isMultipleChoice: false,
    allowAnonymousVotes: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!pollData.question.trim()) {
      return;
    }

    const validOptions = pollData.options.filter(option => option.trim() !== '');
    if (validOptions.length < 2) {
      return;
    }

    onCreatePoll({
      ...pollData,
      options: validOptions
    });
  };

  const addOption = () => {
    if (pollData.options.length < 10) {
      setPollData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removeOption = (index: number) => {
    if (pollData.options.length > 2) {
      setPollData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setPollData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const validOptions = pollData.options.filter(option => option.trim() !== '');
  const isValid = pollData.question.trim() !== '' && validOptions.length >= 2;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Create Poll</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="poll-question">Poll Question *</Label>
          <Input
            id="poll-question"
            value={pollData.question}
            onChange={(e) => setPollData(prev => ({ ...prev, question: e.target.value }))}
            placeholder="What would you like to ask?"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="poll-description">Description (optional)</Label>
          <Textarea
            id="poll-description"
            value={pollData.description}
            onChange={(e) => setPollData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Add more context to your poll..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Poll Options *</Label>
          {pollData.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1"
              />
              {pollData.options.length > 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeOption(index)}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          {pollData.options.length < 10 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              disabled={isLoading}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="multiple-choice"
            checked={pollData.isMultipleChoice}
            onCheckedChange={(checked) => setPollData(prev => ({ ...prev, isMultipleChoice: checked }))}
          />
          <Label htmlFor="multiple-choice">Allow multiple selections</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="anonymous-votes"
            checked={pollData.allowAnonymousVotes}
            onCheckedChange={(checked) => setPollData(prev => ({ ...prev, allowAnonymousVotes: checked }))}
          />
          <Label htmlFor="anonymous-votes">Allow anonymous votes</Label>
        </div>

        <div className="flex items-center gap-2 pt-4">
          <Button
            type="submit"
            disabled={!isValid || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Creating Poll...' : 'Create Poll'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};