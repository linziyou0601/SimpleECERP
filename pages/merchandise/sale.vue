<template>
  <v-row class="align-self-start">
    <v-col cols="12">
      <!-- 資料表格 -->
      <v-data-table
        :headers="headers"
        :items="allSales"
        :search="search"
        :page.sync="page"
        :items-per-page="itemsPerPage"
        :loading="loadingSale"
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
              <v-btn icon @click="reload">
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
                  <v-subheader>品名</v-subheader>
                  <v-autocomplete
                    v-model="filter.merchandises"
                    :items="allMerchandises"
                    type="search"
                    item-text="title"
                    item-value="title"
                    hide-details="true"
                    class="max-w-300 pt-0"
                    multiple
                    chips
                  >
                    <template #selection="{ item, index }">
                      <v-chip v-if="index === 0"
                        ><span>{{ item.title }}</span></v-chip
                      >
                      <span v-if="index === 1" class="grey--text text-caption">
                        (與其他{{ filter.merchandises.length - 1 }}個)
                      </span>
                    </template>
                  </v-autocomplete>
                </v-row>
              </v-col>
              <v-col cols="auto">
                <v-row>
                  <v-subheader>類型</v-subheader>
                  <v-select
                    v-model="filter.types"
                    :items="[
                      { key: '銷貨', value: 'sale' },
                      { key: '銷貨退回', value: 'return' },
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
        <template #[`item.type`]="{ item }">
          <span :class="typeColor(item.type, true)">{{
            typeText(item.type)
          }}</span>
        </template>
        <template #[`item.amount`]="{ item }">
          <span :class="typeColor(item.type, true)">{{ item.amount }}</span>
        </template>
        <template #[`item.unitCost`]="{ item }">
          <span :class="typeColor(item.type, true)">{{ item.unitCost }}</span>
        </template>
        <template #[`item.unitPrice`]="{ item }">
          <span :class="typeColor(item.type, true)">{{ item.unitPrice }}</span>
        </template>
        <template #[`item.createdAt`]="{ item }">
          {{ new Date(item.createdAt).toLocaleString() }}
        </template>
        <template #[`item.actions`]="{ item }">
          <v-icon small class="mr-2" @click="edit(item)">mdi-pencil</v-icon>
          <v-icon small class="mr-6" @click="del(item)">mdi-delete</v-icon>
          <v-icon v-if="item.type === 'sale'" small @click="back(item)"
            >mdi-backspace</v-icon
          >
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

    <!-- 建立/修改表單對話框 -->
    <v-dialog v-model="defaultDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">
            {{ saleIndex > -1 ? '修改' : '新增'
            }}{{ typeText(editingSale.type) }}單
          </span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  v-model="editingSale.merchandiseId"
                  type="search"
                  :items="allMerchandises"
                  item-text="title"
                  item-value="id"
                  hide-details="true"
                  @input="merchandiseSelected"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="editingSale.amount"
                  label="數量*"
                  type="number"
                  :rules="[rules.validNumber]"
                  :hint="getHint('amount')"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="editingSale.unitPrice"
                  :label="'單位價格*'"
                  type="number"
                  :rules="[rules.validNumber]"
                  :hint="getHint('unitPrice')"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-chip :color="typeColor(editingSale.type)" class="text-h6"
                  >總金額：{{
                    editingSale.unitPrice * editingSale.amount
                  }}</v-chip
                >
              </v-col>
              <small>*為必填欄位</small>
              <v-col cols="12">
                <v-radio-group
                  v-model.trim="editingSale.type"
                  :disabled="saleIndex > -1"
                  row
                >
                  <v-radio label="銷貨" value="sale"></v-radio>
                  <v-radio label="銷貨退回" value="return"></v-radio>
                </v-radio-group>
              </v-col>
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

    <!-- 刪除表單對話框 -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">刪除</v-card-title>
        <v-card-text
          >確定要刪除這筆紀錄？<br />註：此筆銷貨資料之後有其他進銷存資料，將不允許刪除</v-card-text
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="close">取消</v-btn>
          <v-btn color="error" text @click="delConfirm">刪除</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
export default {
  data() {
    return {
      // 整頁相關
      pageTitle: '銷貨單',
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
        {
          text: '品名',
          value: 'merchandise.title',
          filter: (value) => {
            if (!this.filter.merchandises.length) return true
            return this.filter.merchandises.includes(value)
          },
        },
        {
          text: '類型',
          value: 'type',
          filter: (value) => {
            if (!this.filter.types.length) return true
            return this.filter.types.includes(value)
          },
        },
        { text: '數量', value: 'amount' },
        { text: '單位成本', value: 'unitCost' },
        { text: '單位售價', value: 'unitPrice' },
        { text: '建立時間', value: 'createdAt' },
        { text: '操作', value: 'actions', sortable: false },
      ],
      filter: {
        merchandises: [],
        types: [],
      },
      // 編輯資料表內容
      rules: {
        validNumber: (v) => v > 0 || '必須大於0',
      },
      defaultDialog: false,
      deleteDialog: false,
      defaultSale: {
        merchandiseId: '',
        amount: 0,
        unitPrice: 0,
        type: 'sale',
      },
      editingSale: { ...this.defaultSale },
      saleIndex: -1,
    }
  },
  computed: {
    ...mapGetters('sale', ['allSales', 'loadingSale']),
    ...mapGetters('merchandise', ['allMerchandises']),
    month: {
      get() {
        return this.$store.state.purchase.month
      },
      set(val) {
        this.setMonth(val)
      },
    },
    monthSel: {
      get() {
        return this.$store.state.purchase.monthSel
      },
      set(val) {
        this.setMonthSel(val)
      },
    },
  },
  created() {
    this.getAllMerchandises()
    this.getAllSales()
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  methods: {
    ...mapActions('sale', [
      'getAllSales',
      'createSale',
      'updateSale',
      'deleteSale',
    ]),
    ...mapActions('merchandise', ['getAllMerchandises']),
    ...mapMutations('purchase', ['setMonth', 'setMonthSel']),
    // 資料顯示
    typeColor(type, text = false) {
      return (
        (type === 'sale' ? (text ? '' : 'primary') : 'error') +
        (text ? '--text' : '')
      )
    },
    typeText(type) {
      return type === 'return' ? '銷貨退回' : '銷貨'
    },
    getHint(field) {
      if (field === 'unitPrice' && this.editingSale.type === 'return')
        return '此為銷貨退回單，請注意單位價格的改動'
      return ''
    },
    merchandiseSelected(id) {
      const merchandise = this.allMerchandises.find((mc) => mc.id === id)
      this.editingSale.unitPrice = merchandise.price
    },
    // 增刪改查操作
    reload() {
      this.getAllMerchandises()
      this.getAllSales()
    },
    close() {
      this.defaultDialog = false
      this.deleteDialog = false
      this.saleIndex = -1
      this.editingSale = { ...this.defaultSale }
      this.reload()
    },
    delConfirm() {
      this.deleteSale(this.editingSale)
      this.close()
    },
    del(item) {
      this.deleteDialog = true
      this.saleIndex = item.id
      this.editingSale = { ...item }
    },
    edit(item) {
      this.defaultDialog = true
      this.saleIndex = item.id
      this.editingSale = { ...item }
      this.editingSale.amount = Math.abs(this.editingSale.amount)
    },
    create() {
      this.defaultDialog = true
      this.editingSale = { ...this.defaultSale }
    },
    back(item) {
      this.defaultDialog = true
      this.editingSale = { ...item }
      this.editingSale.type = 'return'
    },
    save() {
      if (this.saleIndex > -1) this.updateSale(this.editingSale)
      else this.createSale(this.editingSale)
      this.close()
    },
  },
}
</script>
