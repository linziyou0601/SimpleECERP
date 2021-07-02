<template>
  <v-row class="align-self-start">
    <v-col cols="120">
      <!-- 資料表格 -->
      <v-data-table
        :headers="headers"
        :items="allOrders"
        :search="search"
        :page.sync="page"
        :items-per-page="itemsPerPage"
        :loading="loadingOrder"
        :mobile-breakpoint="0"
        loading-text="資料載入中，請稍候..."
        hide-default-footer
        multi-sort
        :expanded.sync="expanded"
        show-expand
        class="elevation-3"
        @page-count="pageCount = $event"
      >
        <!-- 上方功能區 -->
        <template #top>
          <v-card flat>
            <v-card-title>
              <v-btn icon @click="getMyOrders">
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
              <v-divider class="ml-2" inset vertical />
              <v-subheader>每頁筆數</v-subheader>
              <v-select
                v-model="itemsPerPage"
                :items="pageSelection"
                item-text="key"
                item-value="value"
                hide-details="true"
                class="max-w-100 pt-0"
                :menu-props="{ bottom: true, offsetY: true }"
              ></v-select>
              <v-spacer />

              <!-- 資料篩選區 -->
              <v-col cols="auto">
                <v-row>
                  <v-dialog
                    ref="monthSelEl"
                    v-model="monthSel"
                    :return-value.sync="month"
                    persistent
                    width="290px"
                    @input="getMyOrders"
                  >
                    <template #activator="{ on, attrs }">
                      <v-subheader>月份</v-subheader>
                      <v-text-field
                        v-model="month"
                        hide-details="true"
                        class="max-w-100 pt-2"
                        readonly
                        v-bind="attrs"
                        v-on="on"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="month"
                      type="month"
                      locale="zh-tw"
                      scrollable
                    >
                      <v-spacer></v-spacer>
                      <v-btn text color="primary" @click="monthSel = false"
                        >取消</v-btn
                      >
                      <v-btn
                        text
                        color="primary"
                        @click="$refs.monthSelEl.save(month)"
                        >選擇</v-btn
                      >
                    </v-date-picker>
                  </v-dialog>
                </v-row>
              </v-col>
              <v-col cols="auto">
                <v-row>
                  <v-subheader>訂單狀態</v-subheader>
                  <v-select
                    v-model="filter.statuses"
                    :items="[
                      { key: '訂單已成立', value: 'created' },
                      { key: '訂單處理中', value: 'pending' },
                      { key: '商品已到貨', value: 'arrived' },
                      { key: '訂單完成', value: 'completed' },
                      { key: '訂單取消', value: 'canceled' },
                    ]"
                    item-text="key"
                    item-value="value"
                    hide-details="true"
                    class="max-w-300 pt-0"
                    multiple
                    chips
                  ></v-select>
                </v-row>
              </v-col>
            </v-card-title>
          </v-card>
        </template>

        <!-- 資料格式定義 -->
        <template #[`item.status`]="{ item }">
          <span :class="item.status | fColor">
            {{ item.status | statusText }}
          </span>
        </template>
        <template #[`item.createdAt`]="{ item }">
          {{ new Date(item.createdAt).toLocaleString() }}
        </template>
        <template #[`item.updatedAt`]="{ item }">
          {{ new Date(item.updatedAt).toLocaleString() }}
        </template>
        <template #[`item.actions`]="{ item }">
          <v-icon small class="mr-2" @click="process(item)"
            >mdi-clipboard-edit</v-icon
          >
        </template>
        <template #expanded-item="{ item }">
          <td colspan="8">
            <v-simple-table
              fixed-header
              class="my-3"
              style="border: 2px rgba(255, 255, 255, 0.12) solid"
            >
              <template #default>
                <thead>
                  <tr>
                    <th class="text-left">品名</th>
                    <th class="text-left">數量</th>
                    <th class="text-left">單價</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(it, key) in item.orderDetail" :key="key">
                    <td>{{ it.merchandise.title }}</td>
                    <td>{{ it.amount + it.merchandise.unit }}</td>
                    <td>{{ it.price | currency }}</td>
                  </tr>
                  <tr>
                    <td colspan="2" class="text-right">總計</td>
                    <td>{{ getTotalPrice(item.orderDetail) | currency }}</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </td>
        </template>
      </v-data-table>
    </v-col>

    <!-- 分頁器 -->
    <v-col cols="12">
      <v-pagination v-model="page" :length="pageCount"></v-pagination>
    </v-col>

    <!-- 處理表單對話框 -->
    <v-dialog v-model="detailDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">處理訂單</span>
          <v-spacer />
          <v-btn icon @click="close">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-container>
            <!-- 個人資料區 -->
            <v-list-item v-if="editingOrder.user" class="mt-5">
              <v-list-item-avatar color="grey darken-3">
                <v-avatar color="accent" v-bind="attrs" v-on="on">
                  <span v-if="!editingOrder.user.avatar" class="text-h7">{{
                    editingOrder.user.name ? editingOrder.user.name[0] : ''
                  }}</span>
                  <v-img
                    v-if="editingOrder.user.avatar"
                    class="rounded-lg"
                    :src="`http://localhost:3000/api/avatar?p=${editingOrder.user.avatar}`"
                    aspect-ratio="1"
                  ></v-img>
                </v-avatar>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>{{
                  editingOrder.user.name
                }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item v-if="editingOrder.user">
              <v-list-item-avatar>
                <v-icon>mdi-phone</v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>{{
                  editingOrder.user.phone
                }}</v-list-item-title>
                <v-list-item-subtitle>電話號碼</v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-icon>mdi-message-text</v-icon>
              </v-list-item-action>
            </v-list-item>

            <v-divider inset></v-divider>

            <v-list-item v-if="editingOrder.user">
              <v-list-item-avatar>
                <v-icon>mdi-email</v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>{{
                  editingOrder.user.email
                }}</v-list-item-title>
                <v-list-item-subtitle>電子信箱</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-divider class="my-3" />

            <!-- 訂單資料區 -->
            <v-list-item
              v-for="(item, key) in editingOrder.orderItems"
              :key="key"
            >
              <v-list-item-avatar color="grey darken-3">
                <v-icon>mdi-image</v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle
                  >{{ item.amount + item.unit }} ×
                  {{ item.price }}元</v-list-item-subtitle
                >
              </v-list-item-content>
            </v-list-item>

            <v-divider class="my-3" />

            <!-- 訂單金額及操作區 -->
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="text-right">總金額</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action class="text-h5">
                {{ getTotalPrice(editingOrder.orderItems) | currency }}
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="text-right">狀態</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action class="text-h5">
                {{ editingOrder.status | statusText }}
              </v-list-item-action>
            </v-list-item>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            v-if="editingOrder.status === 'created'"
            color="primary"
            class="mb-3 px-5"
            outlined
            rounded
            @click="cancelDialog = true"
          >
            取消
          </v-btn>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 確認表單對話框 -->
    <v-dialog v-model="cancelDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">操作確認</v-card-title>
        <v-card-text>
          確定要取消這筆訂單？
          <br />
          一旦確認便不可更改！！
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="accent" text @click="cancelDialog = false">
            取消
          </v-btn>
          <v-btn color="error" text @click="cancel"> 確定 </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
export default {
  filters: {
    currency(price) {
      return price.toLocaleString('zh-TW') + '元'
    },
    fColor(status) {
      return status === 'canceled' ? 'error--text' : ''
    },
    statusText(t) {
      if (t === 'created') return '訂單已成立'
      else if (t === 'pending') return '訂單處理中'
      else if (t === 'arrived') return '商品已到貨'
      else if (t === 'completed') return '訂單完成'
      else if (t === 'canceled') return '訂單取消'
      return ''
    },
  },
  data() {
    return {
      // 整頁相關
      pageTitle: '我的訂單',
      // 資料表格分頁
      page: 1,
      pageCount: 0,
      itemsPerPage: 10,
      pageSelection: [
        { key: '10', value: 10 },
        { key: '20', value: 20 },
        { key: '30', value: 30 },
        { key: '50', value: 50 },
      ],
      // 資料表內容顯示
      search: '',
      expanded: [],
      headers: [
        { text: '編號', value: 'id' },
        {
          text: '訂單狀態',
          value: 'status',
          filter: (value) => {
            if (!this.filter.statuses.length) return true
            return this.filter.statuses.includes(value)
          },
        },
        { text: '訂購人', value: 'user.name' },
        { text: '電話', value: 'user.phone' },
        { text: '建立時間', value: 'createdAt' },
        { text: '更新時間', value: 'updatedAt' },
        { text: '操作', value: 'actions', sortable: false },
        { text: '', value: 'data-table-expand' },
      ],
      filter: {
        statuses: [],
      },
      // 編輯資料表內容
      cancelDialog: false,
      detailDialog: false,
      defaultOrder: {
        userId: '',
        status: '',
        orderItems: {},
      },
      editingOrder: { ...this.defaultOrder },
    }
  },
  computed: {
    ...mapGetters(['token', 'user']),
    ...mapGetters('order', ['allOrders', 'loadingOrder']),
    month: {
      get() {
        return this.$store.state.order.month
      },
      set(val) {
        this.setMonth(val)
      },
    },
    monthSel: {
      get() {
        return this.$store.state.order.monthSel
      },
      set(val) {
        this.setMonthSel(val)
      },
    },
  },
  created() {
    this.getMyOrders()
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  methods: {
    ...mapActions('order', ['getMyOrders', 'createOrder', 'updateOrder']),
    ...mapActions('merchandise', ['getAllMerchandises']),
    ...mapActions('user', ['getAllUsers']),
    ...mapMutations('order', ['setMonth', 'setMonthSel']),
    // 資料顯示
    getTotalPrice(data) {
      if (!data) return 0
      return Object.values(data).reduce(
        (t, { amount, price }) => t + amount * price,
        0
      )
    },
    // 增刪改查操作
    close() {
      this.cancelDialog = false
      this.detailDialog = false
      this.editingOrder = { ...this.defaultOrder }
    },
    process(item) {
      this.detailDialog = true
      this.editingOrder = { ...item }
      this.editingOrder.orderItems = {}
      for (const it of item.orderDetail) {
        this.editingOrder.orderItems[it.merchandiseId] = {
          title: it.merchandise.title,
          unit: it.merchandise.unit,
          amount: it.amount,
          price: it.price,
        }
      }
    },
    cancel() {
      this.editingOrder.action = 'canceled'
      this.updateOrder(this.editingOrder)
      this.close()
    },
  },
}
</script>
