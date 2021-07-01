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
              <v-btn icon @click="reload()">
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
                    @input="reload()"
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
                      { key: '訂單成立', value: 'created' },
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
          {{ item.status | statusText }}
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

    <!-- 右下建立鈕 -->
    <v-btn
      color="primary"
      elevation="6"
      fixed
      bottom
      right
      fab
      class="mb-10"
      @click="create"
    >
      <v-icon>mdi-plus</v-icon>
    </v-btn>

    <!-- 建立表單對話框 -->
    <v-dialog v-model="defaultDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">新增訂單</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  v-model="editingOrder.userId"
                  type="search"
                  :items="allUsers"
                  label="訂購人"
                  item-text="name"
                  item-value="id"
                  hide-details="true"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12">
                <v-row
                  v-for="(item, key) in editingOrder.orderItems"
                  :key="key"
                >
                  <v-col cols="12" sm="7">{{ item.title }}</v-col>
                  <v-col cols="5" sm="2">{{ item.amount + item.unit }}</v-col>
                  <v-col cols="5" sm="2">{{ item.price | currency }}</v-col>
                </v-row>
              </v-col>
              <v-col cols="12">
                <v-divider />
              </v-col>
              <v-col cols="12" sm="7">
                <v-autocomplete
                  v-model="editingItem.merchandise"
                  type="search"
                  :items="allMerchandises"
                  label="商品"
                  item-text="title"
                  item-value="id"
                  hide-details="true"
                  return-object
                  @input="merchandiseSelected"
                ></v-autocomplete>
              </v-col>
              <v-col cols="5" sm="2">
                <v-text-field
                  v-model.number="editingItem.amount"
                  label="數量*"
                  type="number"
                  hide-details="true"
                  :rules="[rules.validNumber]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="5" sm="2">
                <v-text-field
                  v-model.number="editingItem.price"
                  :label="'單價*'"
                  type="number"
                  hide-details="true"
                  :rules="[rules.validNumber]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="2" sm="1" class="d-flex justify-center align-center">
                <v-btn color="primary" icon outlined small @click="addToCart"
                  ><v-icon>mdi-plus</v-icon></v-btn
                >
              </v-col>
              <v-col cols="12">
                <v-chip color="primary" class="text-h6"
                  >總金額：{{
                    getTotalPrice(editingOrder.orderItems) | currency
                  }}</v-chip
                >
              </v-col>
              <small>*為必填欄位</small>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="close">關閉</v-btn>
          <v-btn color="blue darken-1" text @click="save">完成</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 處理表單對話框 -->
    <v-dialog v-model="processDialog" max-width="600px">
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
                <v-img
                  class="elevation-6"
                  src="https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortCurly&accessoriesType=Prescription02&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=White&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Default&skinColor=Light"
                ></v-img>
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
            v-if="getDoNextText()"
            color="primary"
            class="mb-3 px-5"
            depressed
            rounded
            @click="doNext"
          >
            {{ getDoNextText() }}
          </v-btn>
          <v-btn
            v-if="editingOrder.status === 'created'"
            color="primary"
            class="mb-3 px-5"
            outlined
            rounded
            @click="doCancel"
          >
            拒單
          </v-btn>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 確認表單對話框 -->
    <v-dialog v-model="doNextDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">操作確認</v-card-title>
        <v-card-text>
          確定要對這筆訂單「{{ doActionName }}」？
          <br />
          一旦確認便不可更改！！
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="accent" text @click="doNextDialog = false">
            取消
          </v-btn>
          <v-btn :color="doActionName | doNextColor" text @click="doConfirm">
            確定
          </v-btn>
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
    statusText(t) {
      if (t === 'created') return '訂單成立'
      else if (t === 'pending') return '訂單處理中'
      else if (t === 'arrived') return '商品已到貨'
      else if (t === 'completed') return '訂單完成'
      else if (t === 'canceled') return '訂單取消'
      return ''
    },
    doNextColor(t) {
      return t === '拒單' ? 'error' : 'primary'
    },
  },
  data() {
    return {
      // 整頁相關
      pageTitle: '訂單管理',
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
      rules: {
        validNumber: (v) => v > 0 || '必須大於0',
        validNullString: (v) => !!v || '不能為空',
      },
      defaultDialog: false,
      processDialog: false,
      doNextDialog: false,
      defaultOrder: {
        userId: '',
        status: '',
        orderItems: {},
      },
      editingOrder: { ...this.defaultOrder },
      defaultItem: {
        merchandise: {},
        amount: 0,
        price: 0,
      },
      editingItem: { ...this.defaultItem },
      doActionName: '',
    }
  },
  computed: {
    ...mapGetters('order', ['allOrders', 'loadingOrder']),
    ...mapGetters('merchandise', ['allMerchandises']),
    ...mapGetters('user', ['allUsers']),
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
    this.getAllMerchandises()
    this.getAllUsers()
    this.getAllOrders()
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  methods: {
    ...mapActions('order', ['getAllOrders', 'createOrder', 'updateOrder']),
    ...mapActions('merchandise', ['getAllMerchandises']),
    ...mapActions('user', ['getAllUsers']),
    ...mapMutations('order', ['setMonth', 'setMonthSel']),
    // 資料顯示
    merchandiseSelected(merchandise) {
      this.editingItem.price = merchandise.price
    },
    addToCart() {
      const { merchandise, amount, price } = this.editingItem
      const key = merchandise.id || null
      if (!!key && amount > 0 && price > 0) {
        if (!this.editingOrder.orderItems[key]) {
          this.editingOrder.orderItems[key] = {
            title: merchandise.title,
            unit: merchandise.unit,
            amount,
            price,
          }
        } else {
          this.editingOrder.orderItems[key].amount += amount
          this.editingOrder.orderItems[key].price = price
        }
      }
      this.editingItem = { ...this.defaultItem }
    },
    getTotalPrice(data) {
      if (!data) return 0
      return Object.values(data).reduce(
        (t, { amount, price }) => t + amount * price,
        0
      )
    },
    getDoNextText() {
      const t = this.editingOrder.status
      if (t === 'created') return '接單'
      else if (t === 'pending') return '到貨'
      else if (t === 'arrived') return '完成銷貨'
      else if (t === 'completed') return ''
      else if (t === 'canceled') return ''
      return ''
    },
    // 增刪改查操作
    reload() {
      this.getAllMerchandises()
      this.getAllUsers()
      this.getAllOrders()
    },
    close() {
      this.defaultDialog = false
      this.processDialog = false
      this.doNextDialog = false
      this.editingOrder = { ...this.defaultOrder }
      this.editingItem = { ...this.defaultItem }
    },
    create() {
      this.defaultDialog = true
      this.editingOrder = { ...this.defaultOrder }
      this.editingItem = { ...this.defaultItem }
    },
    save() {
      this.createOrder(this.editingOrder)
      this.close()
    },
    process(item) {
      this.processDialog = true
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
    doCancel() {
      this.doNextDialog = true
      this.doActionName = '拒單'
    },
    doNext() {
      this.doNextDialog = true
      this.doActionName = this.getDoNextText()
    },
    doConfirm() {
      const ac = this.doActionName
      if (ac === '接單') this.editingOrder.action = 'pending'
      else if (ac === '到貨') this.editingOrder.action = 'arrived'
      else if (ac === '完成銷貨') this.editingOrder.action = 'completed'
      else if (ac === '拒單') this.editingOrder.action = 'canceled'
      this.updateOrder(this.editingOrder)
      this.close()
    },
  },
}
</script>
