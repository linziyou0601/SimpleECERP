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
                  <v-subheader>性別</v-subheader>
                  <v-select
                    v-model="filter.genders"
                    :items="[
                      { key: '男', value: 'male' },
                      { key: '女', value: 'female' },
                      { key: '不公開', value: 'hide' },
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
              <v-col cols="auto">
                <v-row>
                  <v-subheader>權限</v-subheader>
                  <v-select
                    v-model="filter.scopes"
                    :items="[
                      { key: '管理員', value: 'admin' },
                      { key: '顧客', value: 'customer' },
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
        <template #[`item.gender`]="{ item }">
          {{
            item.gender === 'male'
              ? '男'
              : item.gender === 'female'
              ? '女'
              : '不公開'
          }}
        </template>
        <template #[`item.birth`]="{ item }">
          {{ !item.birth ? '' : new Date(item.birth).toLocaleDateString() }}
        </template>
        <template #[`item.scope`]="{ item }">
          {{ item.scope === 'admin' ? '管理員' : '顧客' }}
        </template>
        <template #[`item.actions`]="{ item }">
          <v-icon small class="mr-2" @click="edit(item)">mdi-pencil</v-icon>
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
                  @input="userSelected"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12">
                <v-row
                  v-for="(item, key) in editingOrder.orderItems"
                  :key="key"
                >
                  <v-col cols="12" sm="7">{{ item.title }}</v-col>
                  <v-col cols="5" sm="2">{{ item.amount + item.unit }}</v-col>
                  <v-col cols="5" sm="2">{{ item.unitPrice }}元</v-col>
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
                  v-model.number="editingItem.unitPrice"
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
                  >總金額：{{ getTotalPrice() }}</v-chip
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
                  {{ item.unitPrice }}元</v-list-item-subtitle
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
                {{ getTotalPrice() }}
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="text-right">狀態</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action class="text-h5">
                {{ editingOrder.status }}
              </v-list-item-action>
            </v-list-item>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="close">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 刪除表單對話框 -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">刪除</v-card-title>
        <v-card-text>確定要刪除這筆訂單？</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="close">取消</v-btn>
          <v-btn color="error" text>刪除</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
export default {
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
      headers: [
        { text: '編號', value: 'id' },
        { text: '訂單狀態', value: 'status' },
        { text: '訂購人姓名', value: 'user.name' },
        { text: '訂購人電話', value: 'user.phone' },
        { text: '詳細資料', value: 'orderDetail' },
        { text: '操作', value: 'actions', sortable: false },
      ],
      filter: {
        genders: [],
        scopes: [],
      },
      // 編輯資料表內容
      rules: {
        validNumber: (v) => v > 0 || '必須大於0',
        validNullString: (v) => !!v || '不能為空',
      },
      defaultDialog: false,
      processDialog: false,
      defaultOrder: {
        userId: '',
        status: '',
        orderItems: {},
      },
      editingOrder: { ...this.defaultOrder },
      defaultItem: {
        merchandise: {},
        amount: 0,
        unitPrice: 0,
      },
      editingItem: { ...this.defaultItem },
    }
  },
  computed: {
    ...mapGetters('order', ['allOrders', 'loadingOrder']),
    ...mapGetters('merchandise', ['allMerchandises']),
    ...mapGetters('user', ['allUsers']),
  },
  created() {
    this.getAllMerchandises()
    this.getAllUsers()
    this.getAllOrders()
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  methods: {
    ...mapActions('order', [
      'getAllOrders',
      'createOrder',
      'updateOrder',
      'deleteOrder',
    ]),
    ...mapActions('merchandise', ['getAllMerchandises']),
    ...mapActions('user', ['getAllUsers']),
    // 資料顯示
    userSelected(id) {
      // const user = this.allUsers.find((mc) => mc.id === id)
      // this.editingOrder.unitPrice = merchandise.price
    },
    merchandiseSelected(merchandise) {
      this.editingItem.unitPrice = merchandise.price
    },
    addToCart() {
      const { merchandise, amount, unitPrice } = this.editingItem
      const key = merchandise.id || null
      if (!!key && amount > 0 && unitPrice > 0) {
        if (!this.editingOrder.orderItems[key]) {
          this.editingOrder.orderItems[key] = {
            title: merchandise.title,
            unit: merchandise.unit,
            amount,
            unitPrice,
          }
        } else {
          this.editingOrder.orderItems[key].amount += amount
          this.editingOrder.orderItems[key].unitPrice = unitPrice
        }
      }
      this.editingItem = { ...this.defaultItem }
    },
    getTotalPrice() {
      if (!this.editingOrder.orderItems) return 0
      return Object.values(this.editingOrder.orderItems).reduce(
        (t, { amount, unitPrice }) => t + amount * unitPrice,
        0
      )
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
      this.editingOrder = { ...this.defaultOrder }
      this.editingItem = { ...this.defaultItem }
    },
    edit(item) {
      this.processDialog = true
      this.editingOrder = { ...item }
      this.editingOrder.orderItems = {}
      for (const it of item.orderDetail) {
        this.editingOrder.orderItems[it.merchandiseId] = {
          title: it.merchandise.title,
          unit: it.merchandise.unit,
          amount: it.amount,
          unitPrice: it.price,
        }
      }
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
  },
}
</script>
