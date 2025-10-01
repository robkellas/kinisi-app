'use client';

import { useState } from 'react';
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import type { Schema } from "@/amplify/data/resource";
import DeleteConfirmationModal from './DeleteConfirmationModal';

// Configure Amplify
Amplify.configure(outputs);

type Action = Schema["Action"]["type"];

interface AddActionModalProps {
  onClose: () => void;
  onAdd?: (actionData: any) => void; // Made optional since we handle API calls internally
  onDelete?: (actionId: string) => void; // Add delete callback
  editingAction?: Action | null;
}

export default function AddActionModal({ onClose, onAdd, onDelete, editingAction }: AddActionModalProps) {
  console.log('AddActionModal rendered:', { editingAction: !!editingAction, onClose: !!onClose });
  const client = generateClient<Schema>();
  const [formData, setFormData] = useState({
    name: editingAction?.name || '',
    description: editingAction?.description || '',
    type: editingAction?.type || 'ENCOURAGE' as 'ENCOURAGE' | 'AVOID',
    progressPoints: editingAction?.progressPoints || 1,
            frequency: editingAction?.frequency || 'DAILY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONETIME',
    targetCount: editingAction?.targetCount || 1,
    timeOfDay: editingAction?.timeOfDay || 'ANYTIME' as 'ANYTIME' | 'MORNING' | 'AFTERNOON' | 'EVENING'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDescription, setShowDescription] = useState(!!editingAction?.description);

  const handleDelete = () => {
    if (!editingAction || !onDelete) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!editingAction || !onDelete) return;
    
    setIsDeleting(true);
    try {
      console.log('Deleting action:', editingAction.id);
      await client.models.Action.delete({ id: editingAction.id });
      console.log('Action deleted successfully');
      
      // Call the delete callback to refresh the parent
      onDelete(editingAction.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete action:', error);
      alert('Failed to delete action. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      // Ensure targetCount is 1 when "None" is selected
      const submitData = {
        ...formData,
        targetCount: formData.frequency === 'ONETIME' ? 1 : formData.targetCount
      };

      if (editingAction) {
        // Update existing action
        console.log('Updating action:', editingAction.id, submitData);
        await client.models.Action.update({
          id: editingAction.id,
          ...submitData,
        });
        console.log('Action updated successfully');
      } else {
        // Create new action
        console.log('Creating new action:', submitData);
        await client.models.Action.create({
          ...submitData,
          completed: false, // New actions are not completed
          createdAt: new Date().toISOString(),
        });
        console.log('Action created successfully');
      }
      // Close modal - the parent will automatically refresh via the observeQuery subscription
      onClose();
    } catch (error) {
      console.error('Failed to save action:', error);
      alert('Failed to save action. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {editingAction ? 'Edit Action' : 'Add New Action'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <div className="flex gap-2">
              {[
                { value: 'ENCOURAGE', label: 'Encourage' },
                { value: 'AVOID', label: 'Avoid' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: value as 'ENCOURAGE' | 'AVOID' }))}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    formData.type === value
                      ? value === 'ENCOURAGE'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              formData.type === 'ENCOURAGE' 
                ? 'text-indigo-700 dark:text-indigo-300' 
                : 'text-purple-700 dark:text-purple-300'
            }`}>
              {formData.type === 'ENCOURAGE' 
                ? 'What do you want to encourage?' 
                : 'What do you want to avoid?'
              }
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={formData.type === 'ENCOURAGE' 
                ? 'e.g., Drink 8 glasses of water'
                : 'e.g., Eating junk food'
              }
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-gray-100 ${
                formData.type === 'ENCOURAGE'
                  ? 'border-indigo-300 dark:border-indigo-600 focus:ring-indigo-500 focus:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-purple-300 dark:border-purple-600 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              }`}
              required
            />
          </div>

          {/* Description */}
          <div>
            <button
              type="button"
              onClick={() => setShowDescription(!showDescription)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span>Description (Optional)</span>
              <svg 
                className={`w-4 h-4 transition-transform ${showDescription ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDescription && (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add more details about this action..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-100"
              />
            )}
          </div>

          {/* Progress Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Progress Points
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, progressPoints: value }))}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    formData.progressPoints === value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* Repeat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repeat
            </label>
                    <div className="flex gap-2">
                      {[
                        { value: 'ONETIME', label: 'None' },
                        { value: 'DAILY', label: 'Daily' },
                        { value: 'WEEKLY', label: 'Weekly' },
                        { value: 'MONTHLY', label: 'Monthly' }
                      ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, frequency: value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONETIME' }))}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    formData.frequency === value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Count - Only show when not "None" */}
          {formData.frequency !== 'ONETIME' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {formData.targetCount}x per {formData.frequency === 'DAILY' ? 'day' : formData.frequency === 'WEEKLY' ? 'week' : 'month'}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, targetCount: value }))}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      formData.targetCount === value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Routine Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Routine Time
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'ANYTIME', label: 'Anytime' },
                { value: 'MORNING', label: 'Morning' },
                { value: 'AFTERNOON', label: 'Afternoon' },
                { value: 'EVENING', label: 'Evening' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, timeOfDay: value as 'ANYTIME' | 'MORNING' | 'AFTERNOON' | 'EVENING' }))}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    formData.timeOfDay === value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            {/* Delete button (only show when editing) */}
            {editingAction && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Action
              </button>
            )}
            
            {/* Right side buttons */}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
              >
                {isSubmitting ? 'Saving...' : editingAction ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        actionName={editingAction?.name || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
}
