<template>
  <v-row class="align-self-start">
    <v-col cols="12">
      <!-- 資料表格 -->
      <v-data-table
        :headers="headers"
        :items="allAdjustments"
        :search="search"
        :page.sync="page"
        :items-per-page="itemsPerPage"
        :loading="loadingAdjustment"
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
                      { key: '調數量', value: 'amount' },
                      { key: '調成本及數量', value: 'all' },
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
          <span :class="item.type | fColor(true)">{{ item.type | fText }}</span>
        </template>
        <template #[`item.amount`]="{ item }">
          <span :class="item.type | fColor(true)">{{
            item.amount | currency
          }}</span>
        </template>
        <template #[`item.unitCost`]="{ item }">
          <span :class="item.type | fColor(true)">{{
            item.unitCost | currency
          }}</span>
        </template>
        <template #[`item.createdAt`]="{ item }">
          {{ new Date(item.createdAt).toLocaleString() }}
        </template>
        <template #[`item.actions`]="{ item }">
          <v-icon small class="mr-2" @click="edit(item)">mdi-pencil</v-icon>
          <v-icon small class="mr-6" @click="del(item)">mdi-delete</v-icon>
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
            {{ adjustmentIndex > -1 ? '修改' : '新增' }}調整單（{{
              editingAdjustment.type | fText
            }}）
          </span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  v-model="editingAdjustment.merchandiseId"
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
                  v-model.number="editingAdjustment.amount"
                  label="數量*"
                  type="number"
                  :rules="[rules.validNumber]"
                  :hint="getHint('amount')"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-if="editingAdjustment.type !== 'amount'"
                  v-model.number="editingAdjustment.unitCost"
                  :label="'單位成本*'"
                  type="number"
                  :rules="[rules.validNumber]"
                  :hint="getHint('unitCost')"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-chip :color="editingAdjustment.type | fColor" class="text-h6"
                  >總金額：{{
                    (editingAdjustment.unitCost * editingAdjustment.amount)
                      | currency
                  }}</v-chip
                >
              </v-col>
              <small>*為必填欄位</small>
              <v-col cols="12">
                <v-radio-group
                  v-model.trim="editingAdjustment.type"
                  :disabled="adjustmentIndex > -1"
                  row
                >
                  <v-radio label="調數量" value="amount"></v-radio>
                  <v-radio label="調成本及數量" value="all"></v-radio>
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
          >確定要刪除這筆紀錄？<br />註：此筆調整資料之後有其他進銷存資料，將不允許刪除</v-card-text
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
  filters: {
    currency(price) {
      return price.toLocaleString('zh-TW')
    },
    fColor(type, text = false) {
      return (
        (type === 'amount' ? (text ? '' : 'primary') : 'secondary') +
        (text ? '--text' : '')
      )
    },
    fText(type) {
      return type === 'amount' ? '調數量' : '調成本及數量'
    },
  },
  data() {
    return {
      // 整頁相關
      pageTitle: '調整單',
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
        { text: '建立時間', value: 'createdAt' },
        { text: '操作', value: 'actions', sortable: false },
      ],
      filter: {
        merchandises: [],
        types: [],
      },
      // 編輯資料表內容
      rules: {
        validNumber: (v) => v !== 0 || '不能為0',
      },
      defaultDialog: false,
      deleteDialog: false,
      defaultAdjustment: {
        merchandiseId: '',
        amount: 0,
        unitCost: 0,
        type: 'amount',
      },
      editingAdjustment: { ...this.defaultAdjustment },
      adjustmentIndex: -1,
    }
  },
  computed: {
    ...mapGetters('adjustment', ['allAdjustments', 'loadingAdjustment']),
    ...mapGetters('merchandise', ['allMerchandises']),
    month: {
      get() {
        return this.$store.state.adjustment.month
      },
      set(val) {
        this.setMonth(val)
      },
    },
    monthSel: {
      get() {
        return this.$store.state.adjustment.monthSel
      },
      set(val) {
        this.setMonthSel(val)
      },
    },
  },
  created() {
    this.getAllMerchandises()
    this.getAllAdjustments()
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  methods: {
    ...mapActions('adjustment', [
      'getAllAdjustments',
      'createAdjustment',
      'updateAdjustment',
      'deleteAdjustment',
    ]),
    ...mapActions('merchandise', ['getAllMerchandises']),
    ...mapMutations('purchase', ['setMonth', 'setMonthSel']),
    // 資料顯示
    getHint(field) {
      if (field === 'amount') return '此為數量變化值，正值為增加，負值為減少'
      else if (field === 'unitCost') return '此欄位會如同進貨一樣影響成本'
      return ''
    },
    merchandiseSelected(id) {
      const merchandise = this.allMerchandises.find((mc) => mc.id === id)
      this.editingAdjustment.unitCost = merchandise.unitCost
    },
    // 增刪改查操作
    reload() {
      this.getAllMerchandises()
      this.getAllAdjustments()
    },
    close() {
      this.defaultDialog = false
      this.deleteDialog = false
      this.adjustmentIndex = -1
      this.editingAdjustment = { ...this.defaultAdjustment }
      this.reload()
    },
    delConfirm() {
      this.deleteAdjustment(this.editingAdjustment)
      this.close()
    },
    del(item) {
      this.deleteDialog = true
      this.adjustmentIndex = item.id
      this.editingAdjustment = { ...item }
    },
    edit(item) {
      this.defaultDialog = true
      this.adjustmentIndex = item.id
      this.editingAdjustment = { ...item }
    },
    create() {
      this.defaultDialog = true
      this.editingAdjustment = { ...this.defaultAdjustment }
    },
    save() {
      if (this.adjustmentIndex > -1)
        this.updateAdjustment(this.editingAdjustment)
      else this.createAdjustment(this.editingAdjustment)
      this.close()
    },
  },
}
</script>
