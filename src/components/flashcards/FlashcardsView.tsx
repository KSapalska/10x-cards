import { useState } from "react";
import { FlashcardsGrid } from "./FlashcardsGrid";
import { Pagination } from "./Pagination";
import { AddFlashcardModal } from "./AddFlashcardModal";
import { EditFlashcardModal } from "./EditFlashcardModal";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { useFlashcards } from "../hooks/useFlashcards";
import { useAddFlashcard } from "../hooks/useAddFlashcard";
import { useEditFlashcard } from "../hooks/useEditFlashcard";
import { useDeleteFlashcard } from "../hooks/useDeleteFlashcard";
import type { FlashcardDto } from "../../types";

interface ModalState {
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export default function FlashcardsView() {
  // Query params state
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 12,
    sort: "created_at" as const,
    order: "desc" as const,
  });

  // Modal state
  const [modals, setModals] = useState<ModalState>({
    add: false,
    edit: false,
    delete: false,
  });

  // Selected flashcard for edit/delete
  const [selectedFlashcard, setSelectedFlashcard] = useState<FlashcardDto | null>(null);

  // Success/error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hooks
  const { data, isLoading, error, refetch } = useFlashcards(queryParams);
  const { addFlashcard, isAdding } = useAddFlashcard();
  const { editFlashcard, isEditing } = useEditFlashcard();
  const { deleteFlashcard, isDeleting } = useDeleteFlashcard();

  // Handlers for modals
  const openAddModal = () => {
    setModals({ ...modals, add: true });
  };

  const closeAddModal = () => {
    setModals({ ...modals, add: false });
  };

  const openEditModal = (flashcard: FlashcardDto) => {
    setSelectedFlashcard(flashcard);
    setModals({ ...modals, edit: true });
  };

  const closeEditModal = () => {
    setModals({ ...modals, edit: false });
    setSelectedFlashcard(null);
  };

  const openDeleteModal = (flashcard: FlashcardDto) => {
    setSelectedFlashcard(flashcard);
    setModals({ ...modals, delete: true });
  };

  const closeDeleteModal = () => {
    setModals({ ...modals, delete: false });
    setSelectedFlashcard(null);
  };

  // Success handlers
  const handleAddSuccess = () => {
    setSuccessMessage("Fiszka została dodana!");
    refetch();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleEditSuccess = () => {
    setSuccessMessage("Fiszka została zaktualizowana!");
    refetch();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFlashcard) return;

    const success = await deleteFlashcard(selectedFlashcard.id);

    if (success) {
      closeDeleteModal();
      setSuccessMessage("Fiszka została usunięta!");
      refetch();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Navigation handlers
  const handleGenerateClick = () => {
    window.location.href = "/generate";
  };

  const handlePageChange = (page: number) => {
    setQueryParams({ ...queryParams, page });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Moje fiszki</CardTitle>
              <CardDescription>
                {data && data.pagination.total > 0
                  ? `Masz ${data.pagination.total} ${data.pagination.total === 1 ? "fiszkę" : data.pagination.total < 5 ? "fiszki" : "fiszek"}`
                  : "Zarządzaj swoimi fiszkami"}
              </CardDescription>
            </div>
            <Button onClick={openAddModal}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Dodaj fiszkę
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div
              className="rounded-md bg-green-50 p-4 text-green-800 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {(error || errorMessage) && (
            <div
              className="rounded-md bg-destructive/10 p-4 text-destructive border border-destructive/20"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium">{error || errorMessage}</p>
              </div>
            </div>
          )}

          {/* Flashcards Grid */}
          <FlashcardsGrid
            flashcards={data?.data || []}
            isLoading={isLoading}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            onAddClick={openAddModal}
            onGenerateClick={handleGenerateClick}
          />

          {/* Pagination */}
          {data && data.pagination && <Pagination pagination={data.pagination} onPageChange={handlePageChange} />}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddFlashcardModal
        isOpen={modals.add}
        onClose={closeAddModal}
        onSuccess={handleAddSuccess}
        onAdd={addFlashcard}
        isAdding={isAdding}
      />

      <EditFlashcardModal
        isOpen={modals.edit}
        flashcard={selectedFlashcard}
        onClose={closeEditModal}
        onSuccess={handleEditSuccess}
        onEdit={editFlashcard}
        isEditing={isEditing}
      />

      <DeleteConfirmationDialog
        isOpen={modals.delete}
        flashcard={selectedFlashcard}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
