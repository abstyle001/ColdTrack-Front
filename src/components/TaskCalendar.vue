<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useResizeObserver } from '@vueuse/core';
import type { Task, TaskDependency, DependencyType } from '../utils/types';

const props = defineProps<{
  tasks: Task[];
}>();

const emit = defineEmits<{
  (e: 'detail', task: Task): void;
}>();

const { t, locale } = useI18n();

// ===== 月份状态与导航 =====
const now = new Date();
const currentYear = ref(now.getFullYear());
const currentMonth = ref(now.getMonth());

function shiftMonth(delta: number) {
  const d = new Date(currentYear.value, currentMonth.value + delta, 1);
  currentYear.value = d.getFullYear();
  currentMonth.value = d.getMonth();
}

function goToday() {
  const n = new Date();
  currentYear.value = n.getFullYear();
  currentMonth.value = n.getMonth();
}

const monthTitle = computed(() =>
  new Intl.DateTimeFormat(locale.value, { year: 'numeric', month: 'long' }).format(
    new Date(currentYear.value, currentMonth.value, 1),
  ),
);

// 2024-01-01 是周一，作为周一起始的星期名基准
const weekdays = computed(() => {
  const fmt = new Intl.DateTimeFormat(locale.value, { weekday: 'short' });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
});

// ===== 月历网格 =====
interface DayCell {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

// 用本地时区拼 key，与 deadline.slice(0,10) 对齐；toISOString 会有 UTC 偏移问题
function toKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const todayKey = toKey(now);

const dayCells = computed<DayCell[]>(() => {
  const y = currentYear.value;
  const m = currentMonth.value;
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const total = Math.ceil((offset + daysInMonth) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const date = new Date(y, m, 1 - offset + i);
    const key = toKey(date);
    return {
      date,
      key,
      inMonth: date.getMonth() === m,
      isToday: key === todayKey,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    };
  });
});

// ===== 任务落格 =====
const tasksByDay = computed(() => {
  const map = new Map<string, Task[]>();
  for (const task of props.tasks) {
    if (!task.deadline) continue;
    const key = task.deadline.slice(0, 10);
    const list = map.get(key);
    if (list) list.push(task);
    else map.set(key, [task]);
  }
  return map;
});

const unscheduledTasks = computed(() => props.tasks.filter((task) => !task.deadline));

const expandedDays = ref(new Set<string>());
const MAX_VISIBLE = 3;

function visibleTasks(dayKey: string): Task[] {
  const list = tasksByDay.value.get(dayKey) ?? [];
  return expandedDays.value.has(dayKey) ? list : list.slice(0, MAX_VISIBLE);
}

function hiddenCount(dayKey: string): number {
  const list = tasksByDay.value.get(dayKey) ?? [];
  return expandedDays.value.has(dayKey) ? 0 : Math.max(0, list.length - MAX_VISIBLE);
}

function toggleDay(dayKey: string) {
  if (expandedDays.value.has(dayKey)) expandedDays.value.delete(dayKey);
  else expandedDays.value.add(dayKey);
}

const renderedTasks = computed(() => {
  const map = new Map<number, Task>();
  for (const cell of dayCells.value) {
    if (!cell.inMonth) continue;
    for (const task of visibleTasks(cell.key)) map.set(task.id, task);
  }
  return map;
});

const taskDayKey = computed(() => {
  const map = new Map<number, string>();
  for (const cell of dayCells.value) {
    if (!cell.inMonth) continue;
    for (const task of visibleTasks(cell.key)) map.set(task.id, cell.key);
  }
  return map;
});

const monthTaskCount = computed(() =>
  dayCells.value.reduce((sum, cell) => sum + (cell.inMonth ? (tasksByDay.value.get(cell.key)?.length ?? 0) : 0), 0),
);

// 对端不在当前可见卡片中（跨月 / 被筛选 / 被折叠）的依赖
function hiddenDeps(task: Task): TaskDependency[] {
  const map = new Map<number, TaskDependency>();
  for (const d of [...(task.dependencies ?? []), ...(task.dependents ?? [])]) {
    if (!renderedTasks.value.has(d.taskId)) map.set(d.taskId, d);
  }
  return [...map.values()];
}

function hiddenDepsTitle(task: Task): string {
  const list = hiddenDeps(task);
  return `${t('task.calendar.crossMonth', { n: list.length })}: ${list.map((d) => d.title).join(', ')}`;
}

const statusDot: Record<string, string> = {
  Todo: 'bg-muted',
  InProgress: 'bg-info',
  Review: 'bg-warning',
  Completed: 'bg-success',
};

function isOverdue(task: Task): boolean {
  return !!task.deadline && task.status !== 'Completed' && new Date(task.deadline) < new Date();
}

// ===== 依赖边（只从 dependencies 建，dependents 是镜像） =====
const depTypes: DependencyType[] = ['FinishToStart', 'StartToStart', 'FinishToFinish', 'StartToFinish'];

const typeClass: Record<DependencyType, string> = {
  FinishToStart: 'text-primary',
  StartToStart: 'text-info',
  FinishToFinish: 'text-warning',
  StartToFinish: 'text-error',
};

const typeLabel = computed<Record<DependencyType, string>>(() => ({
  FinishToStart: t('task.dependency.fs'),
  StartToStart: t('task.dependency.ss'),
  FinishToFinish: t('task.dependency.ff'),
  StartToFinish: t('task.dependency.sf'),
}));

interface Edge {
  key: string;
  from: number;
  to: number;
  type: DependencyType;
  fromTitle: string;
  toTitle: string;
}

const edges = computed<Edge[]>(() => {
  const list: Edge[] = [];
  const seen = new Set<string>();
  for (const task of props.tasks) {
    if (!renderedTasks.value.has(task.id)) continue;
    for (const dep of task.dependencies ?? []) {
      if (!renderedTasks.value.has(dep.taskId)) continue;
      const key = `${dep.taskId}-${task.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ key, from: dep.taskId, to: task.id, type: dep.dependencyType, fromTitle: dep.title, toTitle: task.title });
    }
  }
  return list;
});

// ===== hover 高亮 =====
const hoveredTaskId = ref<number | null>(null);
const hoveredEdgeKey = ref<string | null>(null);

const relatedIds = computed(() => {
  if (hoveredTaskId.value == null) return null;
  const set = new Set<number>([hoveredTaskId.value]);
  for (const e of edges.value) {
    if (e.from === hoveredTaskId.value) set.add(e.to);
    if (e.to === hoveredTaskId.value) set.add(e.from);
  }
  return set;
});

function edgeOpacity(edge: Edge): number {
  if (hoveredEdgeKey.value === edge.key) return 1;
  if (hoveredTaskId.value != null) {
    return edge.from === hoveredTaskId.value || edge.to === hoveredTaskId.value ? 0.95 : 0.12;
  }
  return 0.5;
}

function edgeWidth(edge: Edge): number {
  const active =
    hoveredEdgeKey.value === edge.key ||
    edge.from === hoveredTaskId.value ||
    edge.to === hoveredTaskId.value;
  return active ? 2.5 : 1.5;
}

// ===== SVG 坐标测量 =====
const containerRef = ref<HTMLElement | null>(null);
const cardRefs = new Map<number, HTMLElement>();
const svgSize = ref({ width: 0, height: 0 });

function setCardRef(taskId: number, el: unknown) {
  if (el instanceof HTMLElement) cardRefs.set(taskId, el);
  else cardRefs.delete(taskId);
}

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  cx: number;
  cy: number;
}

interface RenderedEdge extends Edge {
  path: string;
}

const renderedEdges = ref<RenderedEdge[]>([]);

function buildPath(from: Rect, to: Rect, sameCell: boolean): string {
  // 同格卡片上下紧邻，直线/竖曲线会穿过卡片，改为右侧环绕
  if (sameCell) {
    const bulge = Math.max(from.right, to.right) + 28;
    return `M ${from.right} ${from.cy} C ${bulge} ${from.cy}, ${bulge} ${to.cy}, ${to.right} ${to.cy}`;
  }
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const sx = dx >= 0 ? from.right : from.left;
    const ex = dx >= 0 ? to.left : to.right;
    const ox = Math.max(30, Math.abs(ex - sx) / 2) * (dx >= 0 ? 1 : -1);
    return `M ${sx} ${from.cy} C ${sx + ox} ${from.cy}, ${ex - ox} ${to.cy}, ${ex} ${to.cy}`;
  }
  const sy = dy >= 0 ? from.bottom : from.top;
  const ey = dy >= 0 ? to.top : to.bottom;
  const oy = Math.max(30, Math.abs(ey - sy) / 2) * (dy >= 0 ? 1 : -1);
  return `M ${from.cx} ${sy} C ${from.cx} ${sy + oy}, ${to.cx} ${ey - oy}, ${to.cx} ${ey}`;
}

function measure() {
  const container = containerRef.value;
  if (!container) return;
  const cRect = container.getBoundingClientRect();
  svgSize.value = { width: cRect.width, height: cRect.height };
  const rects = new Map<number, Rect>();
  for (const [id, el] of cardRefs) {
    if (!renderedTasks.value.has(id)) continue;
    const r = el.getBoundingClientRect();
    rects.set(id, {
      left: r.left - cRect.left,
      top: r.top - cRect.top,
      right: r.right - cRect.left,
      bottom: r.bottom - cRect.top,
      cx: r.left - cRect.left + r.width / 2,
      cy: r.top - cRect.top + r.height / 2,
    });
  }
  renderedEdges.value = edges.value.flatMap((edge) => {
    const from = rects.get(edge.from);
    const to = rects.get(edge.to);
    if (!from || !to) return [];
    const sameCell = taskDayKey.value.get(edge.from) === taskDayKey.value.get(edge.to);
    return [{ ...edge, path: buildPath(from, to, sameCell) }];
  });
}

let rafId = 0;
function scheduleMeasure() {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(measure);
}

onMounted(() => nextTick(scheduleMeasure));
onUnmounted(() => cancelAnimationFrame(rafId));
watch([() => props.tasks, currentYear, currentMonth, expandedDays], () => nextTick(scheduleMeasure));
useResizeObserver(containerRef, scheduleMeasure);
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-1">
        <UButton icon="i-lucide-chevron-left" variant="ghost" color="neutral" size="sm" :aria-label="t('task.calendar.prevMonth')" @click="shiftMonth(-1)" />
        <UButton :label="t('task.calendar.today')" variant="outline" color="neutral" size="sm" @click="goToday" />
        <UButton icon="i-lucide-chevron-right" variant="ghost" color="neutral" size="sm" :aria-label="t('task.calendar.nextMonth')" @click="shiftMonth(1)" />
        <span class="ml-2 text-sm font-medium">{{ monthTitle }}</span>
      </div>
      <div class="flex items-center gap-3 text-xs text-muted">
        <span>{{ t('task.calendar.legend') }}</span>
        <span v-for="type in depTypes" :key="type" class="flex items-center gap-1">
          <span class="inline-block w-4 border-t-2 border-current" :class="[typeClass[type], type === 'StartToFinish' ? 'border-dashed' : '']" />
          {{ typeLabel[type] }}
        </span>
      </div>
    </div>

    <div ref="containerRef" class="relative">
      <div class="grid grid-cols-7 rounded-lg border-t border-l border-default overflow-hidden">
        <div v-for="wd in weekdays" :key="wd" class="border-b border-r border-default bg-elevated/50 px-2 py-1.5 text-center text-xs text-muted">
          {{ wd }}
        </div>
        <div
          v-for="cell in dayCells"
          :key="cell.key"
          class="flex min-h-28 flex-col gap-1 border-b border-r border-default p-1.5"
          :class="[
            cell.inMonth ? (cell.isWeekend ? 'bg-muted/20' : 'bg-default') : 'bg-elevated/30 opacity-40',
            cell.isToday ? 'bg-primary/10 ring-1 ring-inset ring-primary' : '',
          ]"
        >
          <div class="text-right text-xs text-muted">{{ cell.date.getDate() }}</div>
          <template v-if="cell.inMonth">
            <div
              v-for="task in visibleTasks(cell.key)"
              :key="task.id"
              :ref="(el) => setCardRef(task.id, el)"
              :title="task.title"
              class="flex cursor-pointer items-center gap-1 rounded border border-default bg-elevated px-1.5 py-1 shadow-sm transition-opacity hover:shadow-md"
              :class="relatedIds && !relatedIds.has(task.id) ? 'opacity-40' : ''"
              @click="emit('detail', task)"
              @mouseenter="hoveredTaskId = task.id"
              @mouseleave="hoveredTaskId = null"
            >
              <span class="w-1.5 h-1.5 shrink-0 rounded-full" :class="statusDot[task.status]" />
              <span class="truncate text-xs" :class="isOverdue(task) ? 'text-error' : ''">{{ task.title }}</span>
              <span
                v-if="hiddenDeps(task).length"
                class="ml-auto flex shrink-0 items-center gap-0.5 text-xs text-muted"
                :title="hiddenDepsTitle(task)"
              >
                <UIcon name="i-lucide-link" class="size-3" />
                {{ hiddenDeps(task).length }}
              </span>
            </div>
            <button
              v-if="hiddenCount(cell.key) > 0"
              type="button"
              class="px-1 text-left text-xs text-primary"
              @click="toggleDay(cell.key)"
            >
              {{ t('task.calendar.more', { n: hiddenCount(cell.key) }) }}
            </button>
            <button
              v-else-if="expandedDays.has(cell.key) && (tasksByDay.get(cell.key)?.length ?? 0) > MAX_VISIBLE"
              type="button"
              class="px-1 text-left text-xs text-muted"
              @click="toggleDay(cell.key)"
            >
              {{ t('task.calendar.collapse') }}
            </button>
          </template>
        </div>
      </div>

      <svg
        class="pointer-events-none absolute inset-0 z-10 size-full"
        :viewBox="`0 0 ${svgSize.width} ${svgSize.height}`"
        aria-hidden="true"
      >
        <defs>
          <!-- 每种类型一个 marker：context-stroke 兼容性差，用 currentColor + 类型色类 -->
          <marker
            v-for="type in depTypes"
            :id="`cal-arrow-${type}`"
            :key="type"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="8"
            markerHeight="8"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
            :class="typeClass[type]"
          >
            <path d="M 0 0.5 L 7.5 4 L 0 7.5 z" fill="currentColor" />
          </marker>
        </defs>
        <g v-for="edge in renderedEdges" :key="edge.key">
          <path
            :d="edge.path"
            fill="none"
            stroke="currentColor"
            :stroke-width="edgeWidth(edge)"
            :stroke-dasharray="edge.type === 'StartToFinish' ? '5 4' : undefined"
            :class="typeClass[edge.type]"
            :opacity="edgeOpacity(edge)"
            :marker-end="`url(#cal-arrow-${edge.type})`"
          />
          <path
            :d="edge.path"
            fill="none"
            stroke="transparent"
            stroke-width="10"
            pointer-events="stroke"
            @mouseenter="hoveredEdgeKey = edge.key"
            @mouseleave="hoveredEdgeKey = null"
          >
            <title>{{ edge.fromTitle }} → {{ edge.toTitle }} ({{ typeLabel[edge.type] }})</title>
          </path>
        </g>
      </svg>
    </div>

    <div v-if="monthTaskCount === 0" class="py-4 text-center text-sm text-muted">
      {{ t('task.calendar.empty') }}
    </div>

    <div v-if="unscheduledTasks.length" class="rounded-lg border border-default p-3">
      <div class="mb-2 text-xs text-muted">{{ t('task.calendar.unscheduled') }} ({{ unscheduledTasks.length }})</div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="task in unscheduledTasks"
          :key="task.id"
          type="button"
          :title="task.title"
          class="flex items-center gap-1 rounded border border-default bg-elevated px-2 py-1 text-xs shadow-sm hover:shadow-md"
          @click="emit('detail', task)"
        >
          <span class="w-1.5 h-1.5 shrink-0 rounded-full" :class="statusDot[task.status]" />
          <span class="max-w-40 truncate">{{ task.title }}</span>
        </button>
      </div>
    </div>
  </div>
</template>