# AI Enhancement Feature for Daily Log Form

## 🎯 Goal
Add "✨ Enhance with AI" button on the daily log form that:
1. Takes the user's rough notes
2. Uses AWS Bedrock AI to improve/expand them
3. Shows a preview of the enhanced version
4. Lets user approve/edit/reject before saving

## 📍 Implementation Location
**File:** `src/components/journal/DailyLogForm.tsx`

## ✅ Changes Needed:

### 1. **Add New State Variables** (after line 80)
```typescript
const [enhancing, setEnhancing] = useState(false);
const [showEnhancedPreview, setShowEnhancedPreview] = useState(false);
const [enhancedTasks, setEnhancedTasks] = useState('');
const [enhancedBlockers, setEnhancedBlockers] = useState('');
```

### 2. **Add Enhance Function** (after line 257)
```typescript
const handleEnhanceWithAI = async () => {
    if (!formData.tasks_completed.trim()) {
        toast({
            title: 'Nothing to enhance',
            description: 'Please write your tasks first',
            variant: 'destructive',
        });
        return;
    }

    setEnhancing(true);
    try {
        // Call AWS Bedrock via Edge Function
        const response = await fetch('/api/enhance-daily-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tasks: formData.tasks_completed,
                blockers: formData.blockers || '',
            }),
        });

        if (!response.ok) throw new Error('Enhancement failed');

        const { enhanced_tasks, enhanced_blockers } = await response.json();
        
        setEnhancedTasks(enhanced_tasks);
        setEnhancedBlockers(enhanced_blockers);
        setShowEnhancedPreview(true);
        
        toast({
            title: '✨ Enhanced!',
            description: 'Review the AI-improved version below',
        });
    } catch (error) {
        toast({
            title: 'Enhancement failed',
            description: 'Could not enhance your log. Try again or save as-is.',
            variant: 'destructive',
        });
    } finally {
        setEnhancing(false);
    }
};

const applyEnhancement = () => {
    setFormData({
        ...formData,
        tasks_completed: enhancedTasks,
        blockers: enhancedBlockers,
    });
    setShowEnhancedPreview(false);
    toast({
        title: 'Applied!',
        description: 'AI enhancements applied to your log',
    });
};

const rejectEnhancement = () => {
    setShowEnhancedPreview(false);
    setEnhancedTasks('');
    setEnhancedBlockers('');
};
```

### 3. **Add UI Button** (after line 487, before blockers section)
```typescript
{/* AI Enhancement Button */}
{formData.tasks_completed.trim() && !showEnhancedPreview && (
    <div className="flex justify-end">
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEnhanceWithAI}
            disabled={enhancing}
            className="gap-2"
        >
            {enhancing ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enhancing...
                </>
            ) : (
                <>
                    ✨ Enhance with AI
                </>
            )}
        </Button>
    </div>
)}

{/*  Enhancement Preview */}
{showEnhancedPreview && (
    <Alert className="bg-purple-50 dark:bg-purple-950 border-purple-200">
        <AlertDescription>
            <div className="space-y-3">
                <p className="font-semibold text-purple-900 dark:text-purple-100">
                    ✨ AI-Enhanced Version (Review & Edit)
                </p>
                
                <div className="space-y-2">
                    <Label>Enhanced Tasks:</Label>
                    <Textarea
                        value={enhancedTasks}
                        onChange={(e) => setEnhancedTasks(e.target.value)}
                        rows={6}
                        className="bg-white dark:bg-gray-900"
                    />
                </div>

{enhancedBlockers && (
                    <div className="space-y-2">
                        <Label>Enhanced Blockers:</Label>
                        <Textarea
                            value={enhancedBlockers}
                            onChange={(e) => setEnhanced Blockers(e.target.value)}
                            rows={3}
                            className="bg-white dark:bg-gray-900"
                        />
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <Button onClick={applyEnhancement} size="sm" className="gap-2">
                        ✅ Apply Enhancement
                    </Button>
                    <Button onClick={rejectEnhancement} variant="outline" size="sm">
                        ❌ Keep Original
                    </Button>
                </div>
            </div>
        </AlertDescription>
    </Alert>
)}
```

### 4. **Create Edge Function** 
**New File:** `supabase/functions/enhance-daily-log/index.ts`
- Takes tasks and blockers as input
- Uses AWS Bedrock to make them more professional
- Returns enhanced_tasks and enhanced_blockers

## 🎨 User Experience Flow:

1.  User types: "fixed bug" in tasks field
2. Clicks "✨ Enhance with AI"
3. AI returns: "Successfully resolved critical bug in the authentication module, improving system stability and user experience"
4. User sees preview, can edit it
5. Clicks "✅ Apply Enhancement" or "❌ Keep Original"
6. Then clicks "Save Log"

## 💡 Benefits:
- Less stress writing logs
- More professional standup content
- Better documentation
- Builds confidence

Ready to implement? This will be awesome! 🚀
