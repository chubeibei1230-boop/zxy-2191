import { ref, computed, watch } from 'vue';
import type { Character } from '../types';
import { mockCharacters } from '../data/mockData';

const STORAGE_KEY = 'shadow-puppetry-characters';

function loadFromStorage(): Character[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    console.warn('Failed to load characters from storage');
  }
  return mockCharacters;
}

function saveToStorage(chars: Character[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
  } catch {
    console.warn('Failed to save characters to storage');
  }
}

const characters = ref<Character[]>(loadFromStorage());

watch(characters, (newVal) => {
  saveToStorage(newVal);
}, { deep: true });

export function useCharacters() {
  function generateId(): string {
    return 'char_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function addCharacter(data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const newChar: Character = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    characters.value.push(newChar);
    return newChar;
  }

  function updateCharacter(id: string, updates: Partial<Character>) {
    const index = characters.value.findIndex(c => c.id === id);
    if (index !== -1) {
      characters.value[index] = {
        ...characters.value[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return characters.value[index];
    }
    return null;
  }

  function deleteCharacter(id: string) {
    const index = characters.value.findIndex(c => c.id === id);
    if (index !== -1) {
      characters.value.splice(index, 1);
      return true;
    }
    return false;
  }

  function copyCharacter(id: string): Character | null {
    const original = characters.value.find(c => c.id === id);
    if (!original) return null;
    const now = new Date().toISOString();
    const copy: Character = {
      ...JSON.parse(JSON.stringify(original)),
      id: generateId(),
      name: original.name + ' (副本)',
      createdAt: now,
      updatedAt: now,
    };
    characters.value.push(copy);
    return copy;
  }

  function getCharacterById(id: string): Character | undefined {
    return characters.value.find(c => c.id === id);
  }

  const allStories = computed(() => {
    const set = new Set(characters.value.map(c => c.story).filter(Boolean));
    return Array.from(set).sort();
  });

  const allOwners = computed(() => {
    const set = new Set(characters.value.map(c => c.owner).filter(Boolean));
    return Array.from(set).sort();
  });

  function exportData(): string {
    return JSON.stringify(characters.value, null, 2);
  }

  function importData(jsonStr: string): { success: boolean; count: number } {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data)) {
        return { success: false, count: 0 };
      }
      const validData: Character[] = data.filter(item =>
        item && typeof item === 'object' && 'name' in item && 'id' in item
      );
      characters.value = validData;
      return { success: true, count: validData.length };
    } catch {
      return { success: false, count: 0 };
    }
  }

  return {
    characters,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    copyCharacter,
    getCharacterById,
    allStories,
    allOwners,
    exportData,
    importData,
  };
}
