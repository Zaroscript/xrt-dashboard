import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface NotesCardProps {
  notes: string;
  onSave: (notes: string) => Promise<void>;
  isSaving?: boolean;
}

export function NotesCard({ notes, onSave, isSaving = false }: NotesCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentNotes, setCurrentNotes] = useState(notes);

  const handleSave = async () => {
    try {
      await onSave(currentNotes);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Notes</CardTitle>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit Notes
            </Button>
          ) : (
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentNotes(notes);
                  setIsEditing(false);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Notes'
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
            className="min-h-[120px]"
            placeholder="Add notes about this client..."
          />
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {notes || "No notes available"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
