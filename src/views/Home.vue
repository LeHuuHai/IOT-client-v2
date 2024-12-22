<template>
    <div>
        <Toast />      
        <div class="max-w-[1440px] flex flex-col mx-auto">You have {{listDevices.length}} devices</div>
        <div class="max-w-[1440px] flex flex-col mx-auto">
            <div class="flex gap-4 mb-4 mt-8">
                <Button label="Daily" @click="setChartDataDaily" />
                <Button label="Weekly" @click="setChartDataWeekly" />
            </div>
            <div class="mb-4 gap-4 flex items-center">
                <label for="">Device: </label>
                <Select v-model="device" :options="listDevices" optionLabel="name" placeholder="Select a Device"
                    class="w-full md:w-56" @update:modelValue="onDeviceSelect"/>
            </div>
            <div class="header">
                <div class="information-box">
                    <p>Threshold: {{ threshold.low }} - {{ threshold.high }}</p>
                </div>
                <div class="threshold-box">
                    <div class="max-w-[1440px] flex flex-col mx-auto">
                        <div class="flex gap-4 mb-4 mt-8">
                            <Button label="New Threshold" @click="toggleForm" class="newthreshold-btn" />
                        </div>
                        <div v-if="isFormVisible">
                            <form @submit.prevent="handleSubmit" class="threshold-form">
                                <div class="form-group">
                                    <label for="threshold-low">New threshold input:</label>
                                    <div class="input-group">
                                        <input id="threshold-low" type="number" v-model="new_low"
                                            placeholder="Low: 0-100" required class="threshold-input" />
                                        <input id="threshold-high" type="number" v-model="new_high"
                                            placeholder="High: 0-100" required class="threshold-input" />
                                    </div>
                                </div>
                                <Button label="Send" @click="sendThreshold()" class="submit-btn" />
                            </form>
                        </div>
                    </div>
                </div>
            </div>           
            <!-- <div class="gap-x-4 flex items-center">
                <label for="">Search:</label>
                <DatePicker v-model="date" dateFormat="dd/mm/yy" />
                <label for="" class="flex justify-center items-center text-3xl"> ~ </label>
                <DatePicker v-model="date" dateFormat="dd/mm/yy" />
                <Button label="Search"></Button>
            </div> -->
            <div class="card">
                <Chart type="line" :data="chartData" :options="chartOptions" class="h-[30rem]" />
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from "vue";
import * as StompJs from '@stomp/stompjs';
import api from "../api";
const stompClient = ref(null);
import { useToast } from "primevue/usetoast";
import { useRouter } from 'vue-router';

const router = useRouter();
const toast = useToast();
const chartData = ref(null);
const chartOptions = ref(null);

const rawData = ref([]);
const listDevices = ref([]);
const value = ref("");
const device = ref()

const threshold = reactive({
    low: 0,
    high: 0
});
var new_low = 0
var new_high = 0

const isFormVisible = ref(false)
const toggleForm = () => {
    isFormVisible.value = !isFormVisible.value;
}

const showToast = (severity, summary, detail) => {
    toast.add({ severity: severity, summary: summary, detail: detail, closable: true, life: 5 * 60 * 1000 });
};

const setChartDataDaily = async () => {
    const response = await api.dailyData(device.value.deviceId);
    rawData.value = response;
}

const setChartDataWeekly = async () => {

    const response = await api.weeklyData(device.value.deviceId);
    rawData.value = response;
}

const connectWebSocket = () => {
    stompClient.value = new StompJs.Client({
        brokerURL: import.meta.env.VITE_WEB_SOCKET,
        onConnect: () => {
            console.log('WebSocket connected');
            stompClient.value.subscribe('/topic/alert', (message) => {
                const alertData = JSON.parse(new TextDecoder().decode(message._binaryBody));
                console.log('Alert received:', alertData);
                showToast('warn', alertData.alert, `${alertData.time.replace("T", " ")} ${alert.deviceName}`);
            });
        },
        onStompError: (error) => {
            console.error('WebSocket Error:', error);
            showToast('error', 'Connection Error', 'Failed to connect to WebSocket server.');
        },
    });
    stompClient.value.activate();
};

const setChartData = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const labels = rawData.value.map(item => {
        const date = new Date(item.time);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}/${month} ${hours}:${minutes}`;
    });

    const data = rawData.value.map(item => item.soilMoistureValue);

    return {
        labels,
        datasets: [
            {
                label: 'Độ ẩm',
                data,
                fill: true,
                tension: 0.4,
                borderColor: documentStyle.getPropertyValue('--p-cyan-500'),
                backgroundColor: 'rgba(0, 188, 212, 0.2)',
            }
        ]
    };
};

const setChartOptions = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary,
                },
                grid: {
                    color: surfaceBorder,
                },
            },
            y: {
                ticks: {
                    color: textColorSecondary,
                },
                grid: {
                    color: surfaceBorder,
                },
            },
        },
    };
};

const sendThreshold = async () => {
    try{
        const response = await api.postThreshold(new_low, new_high, device.value.deviceId);
        console.log('Threshold updated:', response);
        toggleForm();
      } catch (error) {
        // Xử lý lỗi nếu có
        console.error('Error updating threshold:', error);
        toast.error('Failed to update threshold!');
      }
}

const onDeviceSelect = async () => {
    try{
        const response = await api.getThreshold(device.value.deviceId);
        Object.assign(threshold, response);
        console.log('Threshold fletch: ', response);
    }catch(error){
        console.error('Error updating threshold:', error);
    }
}

onMounted(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        router.push('/login');
    }
    listDevices.value = await api.listDevice();
    connectWebSocket();
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});

watch(rawData, (newData) => {
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});
</script>

<style scoped>

.header {
    display: flex;
    justify-content: space-between;
    width: 100%;
}

.information-box {
    margin-top: 20px;
    width: 200px;
}

.threshold-box {
    padding: 20px auto;
    width: 400px;
}

.threshold-form {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    width: 300px;
    padding: 20px;
    margin: auto;
    background-color: #f0f8ff;
    /* Màu nền nhẹ (có thể thay đổi theo ý muốn) */
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Thay đổi màu của các trường nhập liệu */
.threshold-input {
    padding: 8px;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    width: 100%;
}

.threshold-input:focus {
    border-color: #4caf50;
    outline: none;
}

/* Thay đổi màu của nút gửi */
.submit-btn {
    padding: 10px 20px;
    background-color: #4caf50;
    /* Màu nền của nút (có thể thay đổi theo ý muốn) */
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    width: 100%;
    font-size: 1rem;
    margin-top: 10px;
}

.newthreshold-btn {
    padding: 10px 20px;
    background-color: #4caf50;
    /* Màu nền của nút (có thể thay đổi theo ý muốn) */
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    width: 200px;
    font-size: 1rem;
    margin: 0px auto;
}

/* Hiệu ứng hover khi di chuột qua nút */
.submit-btn:hover {
    background-color: #45a049;
}

/* Hiệu ứng khi nhấn nút */
.submit-btn:active {
    background-color: #388e3c;
}

/* Thay đổi màu của các label */
label {
    font-size: 1rem;
    margin-bottom: 5px;
    color: #333;
    /* Màu chữ cho label */
}

.input-group {
    display: flex;
    gap: 10px;
    width: 100%;
}

.tabs {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.tabs button {
    padding: 0.5rem 1rem;
    background-color: #f0f0f0;
    border: none;
    cursor: pointer;
}

.tabs button.active {
    background-color: #007BFF;
    color: white;
}
</style>