import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Review {
  id: string;
  projectId: string;
  clientName: string;
  clientEmail: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

interface ReviewsState {
  reviews: Review[];
  loading: boolean;
  error: string | null;
}

interface ReviewsActions {
  setReviews: (reviews: Review[]) => void;
  addReview: (review: Review) => void;
  updateReview: (review: Review) => void;
  deleteReview: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useReviewsStore = create<ReviewsState & ReviewsActions>()(
  persist(
    (set) => ({
      reviews: [],
      loading: false,
      error: null,

      setReviews: (reviews) => set({ reviews }),

      addReview: (review) =>
        set((state) => ({ reviews: [review, ...state.reviews] })),

      updateReview: (updatedReview) =>
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === updatedReview.id ? updatedReview : r
          ),
        })),

      deleteReview: (id) =>
        set((state) => ({
          reviews: state.reviews.filter((r) => r.id !== id),
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: "reviews-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
