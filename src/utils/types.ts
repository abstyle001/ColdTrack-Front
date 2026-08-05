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
  parentId: string;
  level: number;
  explain: string;
  managerId: string;
  managerName?: string;
  workspace: string;
  addition?: string;
  createdAt: string;
  children?: Department[];
  depth?: number;
}

interface DepartmentTree extends Department {
  children: DepartmentTree[];
}

interface Position {
  id: number;
  name: string;
  duty: string;
  workspace: string;
  addition?: string;
  createdAt: string;
}

interface UserPositionView {
  positionId: number;
  positionName: string;
  positionDuty?: string;
  departmentId?: string;
  departmentName?: string;
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
  id: number;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName?: string;
  creatorId: string;
  creatorName?: string;
  status: 'Todo' | 'InProgress' | 'Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

interface TokenClaim {
  id: string;
  email: string;
  userName: string;
  role: string;
  roles: string[];
  permissions: string[];
}

interface Permission {
  id: number;
  key: string;
  name: string;
  group: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}


interface UserBrief {
  id: string;
  userName: string;
  email: string;
  nickName: string;
  avatar?: string;
  departmentNames: string[];
  positionNames: string[];
}
export type { UserBrief, User, Department, DepartmentTree, Position, UserPositionView, Task, TokenClaim, Permission, Role };
