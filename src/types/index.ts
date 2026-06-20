export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type CharacterStatus =
  | 'pending_assembly'
  | 'pending_demo'
  | 'need_parts'
  | 'ready_to_pack'
  | 'completed';

export interface AccessoryGap {
  name: string;
  required: number;
  available: number;
}

export interface Character {
  id: string;
  name: string;
  story: string;
  linkCount: number;
  accessoryStatus: string;
  demoOrder: number;
  owner: string;
  riskLevel: RiskLevel;
  riskNote: string;
  repairNote: string;
  status: CharacterStatus;
  missingAccessories: AccessoryGap[];
  operationReminders: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  story: string;
  owner: string;
  status: CharacterStatus[];
  riskLevel: RiskLevel[];
  orderMin: number | null;
  orderMax: number | null;
}

export interface CheckResult {
  type: 'error' | 'warning' | 'info';
  message: string;
  characterIds: string[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const STATUS_LABELS: Record<CharacterStatus, string> = {
  pending_assembly: '待装配',
  pending_demo: '待演示',
  need_parts: '需补件',
  ready_to_pack: '可封箱',
  completed: '已完成',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '极高风险',
};
