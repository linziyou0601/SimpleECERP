<template>
  <v-row class="align-self-start">
    <v-col cols="120">
      <!-- 資料表格 -->
      <v-data-table
        :headers="headers"
        :items="allMerchandises"
        :search="search"
        :page.sync="page"
        :items-per-page="itemsPerPage"
        :loading="loadingMerchandise"
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
              <v-btn icon @click="getAllMerchandises">
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
                    v-model="filter.ons"
                    :items="[
                      { key: '上架', value: true },
                      { key: '下架', value: false },
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
        <template #[`item.quantity`]="{ item }">
          <v-chip :color="item.quantity | fColor">{{
            item.quantity | currency
          }}</v-chip>
        </template>
        <template #[`item.unitCost`]="{ item }">
          {{ +item.unitCost.toFixed(2) | currency }}
        </template>
        <template #[`item.price`]="{ item }">
          {{ item.price | currency }}
        </template>
        <template #[`item.on`]="{ item }">
          <v-chip :color="item.on ? 'primary' : 'accent'">{{
            item.on ? '上架' : '下架'
          }}</v-chip>
        </template>
        <template #[`item.actions`]="{ item }">
          <v-icon small class="mr-2" @click="edit(item)">mdi-pencil</v-icon>
          <v-icon small @click="del(item)">mdi-delete</v-icon>
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
            {{ merchandiseIndex > -1 ? '修改' : '新增' }}商品
          </span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="10">
                <v-text-field
                  v-model.trim="editingMerchandise.title"
                  label="品名*"
                  type="text"
                  :rules="[rules.validNullString]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="2">
                <v-text-field
                  v-model.trim="editingMerchandise.unit"
                  label="單位*"
                  type="text"
                  :rules="[rules.validNullString]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="editingMerchandise.price"
                  label="價格*"
                  type="number"
                  :rules="[rules.validNumber]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-switch
                  v-model="editingMerchandise.on"
                  label="上架"
                  color="primary"
                  hide-details
                ></v-switch>
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

    <!-- 刪除表單對話框 -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">刪除</v-card-title>
        <v-card-text
          >確定要刪除這個商品？<br />註：若該商品有進銷存等相關紀錄，請以下架取代刪除</v-card-text
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
import { mapGetters, mapActions } from 'vuex'
export default {
  data() {
    return {
      // 整頁相關
      pageTitle: '商品管理',
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
          value: 'title',
          filter: (value) => {
            if (!this.filter.merchandises.length) return true
            return this.filter.merchandises.includes(value)
          },
        },
        { text: '單位', value: 'unit' },
        { text: '存貨', value: 'quantity' },
        { text: '單位成本', value: 'unitCost' },
        { text: '價格', value: 'price' },
        {
          text: '已上架',
          value: 'on',
          filter: (value) => {
            if (!this.filter.ons.length) return true
            return this.filter.ons.includes(value)
          },
        },
        { text: '操作', value: 'actions', sortable: false },
      ],
      filter: {
        merchandises: [],
        ons: [],
      },
      // 編輯資料表內容
      rules: {
        validNumber: (v) => v > 0 || '必須大於0',
        validNullString: (v) => !!v || '不能為空',
      },
      defaultDialog: false,
      deleteDialog: false,
      defaultMerchandise: {
        title: '',
        unit: '個',
        price: 0,
        on: true,
      },
      editingMerchandise: { ...this.defaultMerchandise },
      merchandiseIndex: -1,
    }
  },
  computed: {
    ...mapGetters('merchandise', ['allMerchandises', 'loadingMerchandise']),
  },
  created() {
    this.getAllMerchandises()
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  filters: {
    currency(price) {
      return price.toLocaleString('zh-TW')
    },
    fColor(quantity) {
      if (quantity < 10) return 'error'
      else if (quantity < 50) return 'secondary'
      else return 'primary'
    },
  },
  methods: {
    ...mapActions('merchandise', [
      'getAllMerchandises',
      'createMerchandise',
      'updateMerchandise',
      'deleteMerchandise',
    ]),
    close() {
      this.defaultDialog = false
      this.deleteDialog = false
      this.merchandiseIndex = -1
      this.editingMerchandise = { ...this.defaultMerchandise }
    },
    delConfirm() {
      this.deleteMerchandise(this.editingMerchandise)
      this.close()
    },
    del(item) {
      this.deleteDialog = true
      this.merchandiseIndex = item.id
      this.editingMerchandise = { ...item }
    },
    edit(item) {
      this.defaultDialog = true
      this.merchandiseIndex = item.id
      this.editingMerchandise = { ...item }
    },
    create() {
      this.defaultDialog = true
      this.editingMerchandise = { ...this.defaultMerchandise }
    },
    save() {
      if (this.merchandiseIndex > -1)
        this.updateMerchandise(this.editingMerchandise)
      else this.createMerchandise(this.editingMerchandise)
      this.close()
    },
  },
}
</script>
