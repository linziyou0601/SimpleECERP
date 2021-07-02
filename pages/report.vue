<template>
  <v-row class="align-self-start">
    <v-col cols="120">
      <!-- 資料表格 -->
      <v-data-table
        :headers="headers"
        :items="allReports"
        :search="search"
        :page.sync="page"
        :items-per-page="itemsPerPage"
        :loading="loadingReport"
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
              <v-btn icon @click="getAllReports">
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
                    :items="allReports"
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
            </v-card-title>
          </v-card>
        </template>

        <!-- 資料格式定義 -->
        <template #[`item.initialInv`]="{ item }">
          <v-chip color="primary">{{ item.initialInv | currency }}</v-chip>
        </template>
        <template #[`item.purchaseNet`]="{ item }">
          <v-chip color="primary">+{{ item.purchaseNet | currency }}</v-chip>
        </template>
        <template #[`item.cogs`]="{ item }">
          <v-chip color="secondary">-{{ item.cogs | currency }}</v-chip>
        </template>
        <template #[`item.finalInv`]="{ item }">
          <v-chip color="primary">{{ item.finalInv | currency }}</v-chip>
        </template>
        <template #[`item.revenue`]="{ item }">
          <v-chip color="accent">{{ item.revenue | currency }}</v-chip>
        </template>
        <template #[`item.saleNet`]="{ item }">
          <v-chip color="accent">{{ item.saleNet | currency }}</v-chip>
        </template>
        <template #[`item.on`]="{ item }">
          <v-chip :color="item.on ? 'primary' : 'accent'">{{
            item.on ? '上架' : '下架'
          }}</v-chip>
        </template>
      </v-data-table>
    </v-col>

    <!-- 分頁器 -->
    <v-col cols="12">
      <v-pagination v-model="page" :length="pageCount"></v-pagination>
    </v-col>
  </v-row>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
export default {
  filters: {
    currency(price) {
      return price.toLocaleString('zh-TW')
    },
    fColor(item) {
      if (item.orders > item.quantity) return 'secondary'
      else return 'primary'
    },
  },
  data() {
    return {
      // 整頁相關
      pageTitle: '報表',
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
        { text: '期初存貨', value: 'initialInv' },
        { text: '進貨淨額', value: 'purchaseNet' },
        { text: '銷貨成本', value: 'cogs' },
        { text: '期末存貨', value: 'finalInv' },
        { text: '銷貨收入', value: 'revenue' },
        { text: '銷貨淨額', value: 'saleNet' },
      ],
      filter: {
        merchandises: [],
      },
    }
  },
  computed: {
    ...mapGetters('report', ['allReports', 'loadingReport']),
    ...mapGetters('merchandise', ['allMerchandises']),
    month: {
      get() {
        return this.$store.state.report.month
      },
      set(val) {
        this.setMonth(val)
      },
    },
    monthSel: {
      get() {
        return this.$store.state.report.monthSel
      },
      set(val) {
        this.setMonthSel(val)
      },
    },
  },
  created() {
    this.getAllMerchandises()
    this.getAllReports()
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  methods: {
    ...mapActions('report', ['getAllReports']),
    ...mapActions('merchandise', ['getAllMerchandises']),
    ...mapMutations('report', ['setMonth', 'setMonthSel']),
    reload() {
      this.getAllMerchandises()
      this.getAllReports()
    },
  },
}
</script>
