
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const defaultAuthBackgrounds: string[] = [
  'https://picsum.photos/seed/corporate_campus/1200/900',
  'https://picsum.photos/seed/luxury_complex/1200/900',
  'https://picsum.photos/seed/office_interior/1200/900',
  'https://picsum.photos/seed/landscaping/1200/900',
  'https://picsum.photos/seed/lobby_design/1200/900'
];

interface AuthLayoutState {
  backgroundImages: string[];
  addBackgroundImage: (imageBase64: string) => void;
  removeBackgroundImage: (index: number) => void;
}

export const useAuthLayoutStore = create<AuthLayoutState>()(
  persist(
    (set) => ({
      backgroundImages: defaultAuthBackgrounds,
      addBackgroundImage: (imageBase64) =>
        set((state) => ({
          backgroundImages: [...state.backgroundImages, imageBase64],
        })),
      removeBackgroundImage: (index) =>
        set((state) => ({
          backgroundImages: state.backgroundImages.filter((_, i) => i !== index),
        })),
    }),
    {
      name: 'paradigm-auth-layout-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
