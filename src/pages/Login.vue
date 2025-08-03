<template>
  <div class="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#1a2a6c] via-[#b21f1f] to-[#fdbb2d] p-4 relative overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.05)_0%,transparent_30%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.05)_0%,transparent_30%)]"></div>
    <el-card class="w-full max-w-md rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.2)] overflow-hidden relative z-10 bg-white/96 backdrop-blur-sm transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
      <div class="p-[35px_30px_20px] text-center">
        <div class="flex items-center justify-center mb-6">
          <el-icon class="text-[#409eff] text-2xl mr-3"><Key /></el-icon>
          <h1 class="text-[26px] font-bold bg-gradient-to-r from-[#409eff] to-[#66b1ff] bg-clip-text text-transparent">ColdTrack Login</h1>
        </div>
        <h2 class="text-[24px] font-semibold text-[#303133] mb-2">欢迎回来</h2>
        <p class="text-[14px] text-[#606266]/90">请输入您的账号信息登录</p>
      </div>
      
      <el-form 
        :model="loginForm" 
        :rules="rules" 
        ref="loginFormRef" 
        class="p-[10px_30px_35px]"
      >
        <el-form-item prop="username" class="mb-5">
          <el-input 
            v-model="loginForm.username" 
            placeholder="用户名或邮箱" 
            :prefix-icon="User"
            :class="usernameFocused ? 'input-focused' : ''"
            @focus="usernameFocused = true"
            @blur="usernameFocused = false"
            class="h-[50px] rounded-lg border-[#e4e7ed] transition-all duration-300"
          />
        </el-form-item>
        
        <el-form-item prop="password" class="mb-5">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="密码" 
            :prefix-icon="Lock"
            :show-password="showPassword"
            :class="passwordFocused ? 'input-focused' : ''"
            @focus="passwordFocused = true"
            @blur="passwordFocused = false"
            class="h-[50px] rounded-lg border-[#e4e7ed] transition-all duration-300"
          />
        </el-form-item>
        
        <el-form-item class="flex justify-between items-center mb-7">
          <el-checkbox 
            v-model="loginForm.rememberMe" 
            class="text-[#606266] text-sm"
          >
            记住我
          </el-checkbox>
          <el-link type="primary" class="text-sm transition-colors hover:text-[#66b1ff]">忘记密码?</el-link>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin"
            :loading="isLoading"
            class="w-full h-[50px] text-base font-medium rounded-lg bg-gradient-to-r from-[#409eff] to-[#66b1ff] border-none transition-all duration-300 hover:from-[#3688e6] hover:to-[#5a9def] hover:-translate-y-1 hover:shadow-[0_5px_15px_rgba(64,158,255,0.3)] active:translate-y-0"
          >
            登录
          </el-button>
        </el-form-item>
        
        <div class="text-center mt-6 text-sm text-[#606266]">
          <span>还没有账号?</span>
          <el-link type="primary" class="ml-1 font-medium transition-colors hover:text-[#66b1ff]">立即注册</el-link>
        </div>
      </el-form>
    </el-card>
    
    <!-- 页脚信息 -->
    <footer class="mt-8 text-white/70 text-xs text-center z-10">
      <p>© 2025 ColdTrack. 保留所有权利</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElForm, ElFormItem, ElInput, ElButton, ElCheckbox, ElLink, ElCard, ElIcon, ElMessage } from 'element-plus';
import { User, Lock, Key } from '@element-plus/icons-vue';
import request from '../utils/request';
import { loginStatus, token } from '../hooks/useStorage';
import { useRouter } from 'vue-router';

const router = useRouter();

const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false
});

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
};

// 表单引用
const loginFormRef = ref<InstanceType<typeof ElForm>>();

// 状态变量
const usernameFocused = ref(false);
const passwordFocused = ref(false);
const showPassword = ref(false);
const isLoading = ref(false);

// 登录处理函数
const handleLogin = () => {
  loginFormRef.value?.validate(async (valid) => {
    if (valid) {
      isLoading.value = true;
      const [err, data] = await request<string>('/account/login', 'POST', {
        body: {
          email: loginForm.username,
          password: loginForm.password,
        }
      });
      if (err) {
        ElMessage.error(err);
        isLoading.value = false;
        return;
      }
      ElMessage.success('登录成功');
      token.value = data;
      loginStatus.value = true;
      isLoading.value = false;
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  });
};
</script>

<style scoped>
</style>
