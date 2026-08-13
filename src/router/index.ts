import {
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw,
} from "vue-router";
import { loginStatus } from "../utils/useStorage";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/home",
    component: () => import("../components/MainLayout.vue"),
    children: [
      {
        path: "/home",
        name: "home",
        component: () => import("../pages/Home.vue"),
      },
      {
        path: "/person",
        name: "person",
        component: () => import("../pages/Person.vue"),
      },
      {
        path: "/department",
        name: "department",
        component: () => import("../pages/Department.vue"),
      },
      {
        path: "/position",
        name: "position",
        component: () => import("../pages/Position.vue"),
      },
      {
        path: "/task",
        name: "task",
        component: () => import("../pages/Task.vue"),
      },
      {
        path: "/me",
        name: "me",
        component: () => import("../pages/Me.vue"),
      },
      {
        path: "/settings",
        name: "settings",
        component: () => import("../pages/Settings.vue"),
      },
      {
        path: "/role-permission",
        name: "role-permission",
        component: () => import("../pages/RolePermission.vue"),
      },
    ],
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../pages/Login.vue"),
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to, _, next) => {
  if (to.path === "/login" || to.path === "/register") {
    next();
    return;
  }
  if (loginStatus.value) {
    next();
    return;
  }
  next({ path: "/login" });
});
export default router;
