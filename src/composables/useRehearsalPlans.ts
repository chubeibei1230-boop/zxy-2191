import { ref, computed, watch } from 'vue';
import type { RehearsalPlan, RehearsalCharacter, RehearsalStatus, RehearsalResult } from '../types';
import { normalizeRehearsalPlan } from '../types';

const STORAGE_KEY = 'shadow-puppetry-rehearsal-plans';

function generateSamplePlans(): RehearsalPlan[] {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return [
    {
      id: 'rh_sample_001',
      name: '三打白骨精 - 首次全流程排练',
      story: '三打白骨精',
      venue: '剧院一号排练厅',
      scheduledAt: tomorrow.toISOString().slice(0, 16),
      owner: '张导演',
      status: 'scheduled',
      characters: [
        { characterId: 'char_demo_001', order: 1, rehearsalResult: 'not_started', rehearsalNote: '', checkedBy: '' },
        { characterId: 'char_demo_002', order: 2, rehearsalResult: 'not_started', rehearsalNote: '', checkedBy: '' },
        { characterId: 'char_demo_003', order: 3, rehearsalResult: 'not_started', rehearsalNote: '', checkedBy: '' },
        { characterId: 'char_demo_004', order: 4, rehearsalResult: 'not_started', rehearsalNote: '', checkedBy: '' },
        { characterId: 'char_demo_005', order: 5, rehearsalResult: 'not_started', rehearsalNote: '', checkedBy: '' },
        { characterId: 'char_demo_006', order: 6, rehearsalResult: 'not_started', rehearsalNote: '', checkedBy: '' },
      ],
      problemNotes: '',
      summaryNote: '',
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
    {
      id: 'rh_sample_002',
      name: '木兰从军 - 角色动作排练',
      story: '木兰从军',
      venue: '剧院二号排练厅',
      scheduledAt: now.toISOString().slice(0, 16),
      owner: '李导演',
      status: 'in_progress',
      characters: [
        { characterId: 'char_demo_007', order: 1, rehearsalResult: 'pass', rehearsalNote: '动作流畅，出场效果好', checkedBy: '李导演' },
        { characterId: 'char_demo_008', order: 2, rehearsalResult: 'pass', rehearsalNote: '', checkedBy: '李导演' },
        { characterId: 'char_demo_009', order: 3, rehearsalResult: 'need_rehearse', rehearsalNote: '关节操作配合需加强', checkedBy: '李导演' },
        { characterId: 'char_demo_010', order: 4, rehearsalResult: 'not_started', rehearsalNote: '', checkedBy: '' },
        { characterId: 'char_demo_011', order: 5, rehearsalResult: 'not_started', rehearsalNote: '', checkedBy: '' },
        { characterId: 'char_demo_012', order: 6, rehearsalResult: 'not_started', rehearsalNote: '', checkedBy: '' },
      ],
      problemNotes: '单于角色动作配合需要双人操作，建议安排助手',
      summaryNote: '',
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];
}

function loadFromStorage(): RehearsalPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(item => normalizeRehearsalPlan(item));
      }
    }
  } catch {
    console.warn('Failed to load rehearsal plans from storage');
  }
  return generateSamplePlans();
}

function saveToStorage(plans: RehearsalPlan[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {
    console.warn('Failed to save rehearsal plans to storage');
  }
}

const rehearsalPlans = ref<RehearsalPlan[]>(loadFromStorage());

watch(rehearsalPlans, (newVal) => {
  saveToStorage(newVal);
}, { deep: true });

export function useRehearsalPlans() {
  function generateId(): string {
    return 'rh_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function addPlan(data: Omit<RehearsalPlan, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const newPlan: RehearsalPlan = normalizeRehearsalPlan({
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    });
    rehearsalPlans.value.push(newPlan);
    return newPlan;
  }

  function updatePlan(id: string, updates: Partial<RehearsalPlan>) {
    const index = rehearsalPlans.value.findIndex(p => p.id === id);
    if (index !== -1) {
      rehearsalPlans.value[index] = normalizeRehearsalPlan({
        ...rehearsalPlans.value[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      return rehearsalPlans.value[index];
    }
    return null;
  }

  function deletePlan(id: string) {
    const index = rehearsalPlans.value.findIndex(p => p.id === id);
    if (index !== -1) {
      rehearsalPlans.value.splice(index, 1);
      return true;
    }
    return false;
  }

  function getPlanById(id: string): RehearsalPlan | undefined {
    return rehearsalPlans.value.find(p => p.id === id);
  }

  function addCharacterToPlan(planId: string, characterId: string, order?: number) {
    const plan = getPlanById(planId);
    if (!plan) return null;

    if (plan.characters.some(c => c.characterId === characterId)) {
      return plan;
    }

    const newOrder = order ?? (plan.characters.length > 0
      ? Math.max(...plan.characters.map(c => c.order)) + 1
      : 1);

    const newCharacter: RehearsalCharacter = {
      characterId,
      order: newOrder,
      rehearsalResult: 'not_started',
      rehearsalNote: '',
      checkedBy: '',
    };

    return updatePlan(planId, {
      characters: [...plan.characters, newCharacter],
    });
  }

  function removeCharacterFromPlan(planId: string, characterId: string) {
    const plan = getPlanById(planId);
    if (!plan) return null;

    return updatePlan(planId, {
      characters: plan.characters.filter(c => c.characterId !== characterId),
    });
  }

  function updateCharacterResult(
    planId: string,
    characterId: string,
    updates: Partial<RehearsalCharacter>
  ) {
    const plan = getPlanById(planId);
    if (!plan) return null;

    return updatePlan(planId, {
      characters: plan.characters.map(c =>
        c.characterId === characterId ? { ...c, ...updates } : c
      ),
    });
  }

  function moveCharacterOrder(planId: string, characterId: string, direction: 'up' | 'down') {
    const plan = getPlanById(planId);
    if (!plan) return null;

    const sorted = [...plan.characters].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(c => c.characterId === characterId);
    if (idx === -1) return plan;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return plan;

    const tempOrder = sorted[idx].order;
    sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
    sorted[swapIdx] = { ...sorted[swapIdx], order: tempOrder };

    return updatePlan(planId, { characters: sorted });
  }

  const allVenues = computed(() => {
    const set = new Set(rehearsalPlans.value.map(p => p.venue).filter(Boolean));
    return Array.from(set).sort();
  });

  const allPlanOwners = computed(() => {
    const set = new Set(rehearsalPlans.value.map(p => p.owner).filter(Boolean));
    return Array.from(set).sort();
  });

  function getPlanStats(plan: RehearsalPlan) {
    const total = plan.characters.length;
    const pass = plan.characters.filter(c => c.rehearsalResult === 'pass').length;
    const fail = plan.characters.filter(c => c.rehearsalResult === 'fail').length;
    const needRehearse = plan.characters.filter(c => c.rehearsalResult === 'need_rehearse').length;
    const notStarted = plan.characters.filter(c => c.rehearsalResult === 'not_started').length;
    const progress = total > 0 ? Math.round(((total - notStarted) / total) * 100) : 0;
    const passRate = total > 0 && (total - notStarted) > 0 ? Math.round((pass / (total - notStarted)) * 100) : 0;

    return { total, pass, fail, needRehearse, notStarted, progress, passRate };
  }

  return {
    rehearsalPlans,
    addPlan,
    updatePlan,
    deletePlan,
    getPlanById,
    addCharacterToPlan,
    removeCharacterFromPlan,
    updateCharacterResult,
    moveCharacterOrder,
    allVenues,
    allPlanOwners,
    getPlanStats,
  };
}
