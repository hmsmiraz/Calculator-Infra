export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: { user: User; token: string };
  errors?: { field: string; message: string }[];
}

export type Operator = '+' | '-' | '*' | '/';

export interface CalculationResult {
  id: number;
  result: number;
  expression: string;
  operation: string;
  timestamp: string;
}

export interface CalculationHistoryEntry {
  id: number;
  user_id: number;
  operand_a: number;
  operand_b: number;
  operator: string;
  result: number;
  expression: string;
  operation: string;
  created_at: string;
}

export interface HistoryResponse {
  success: boolean;
  cached?: boolean;
  data?: {
    calculations: CalculationHistoryEntry[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  };
}

export interface CalcApiResponse {
  success: boolean;
  message?: string;
  data?: CalculationResult;
  errors?: { field: string; message: string }[];
}

export interface UserStats {
  total_calculations: number;
  by_operation: {
    additions: number;
    subtractions: number;
    multiplications: number;
    divisions: number;
  };
  last_calculation: string | null;
}
