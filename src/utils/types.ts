export const Status = {
  OK: 200,
  UN_AUTHORIZED: 401,
  FORBIDDEN: 403,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  NOT_FOUND: 404,
} as const;

interface Department {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Position {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  department?: Department;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  userName: string;
  email: string;
  nickName: string;
  phone?: string;
  city?: string;
  createdAt: string;
  avatar: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assignee?: User;
  creatorId: string;
  creator?: User;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export type { User, Department, Position, Task };
