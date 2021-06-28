<template>
  <v-row class="align-self-start">
    <v-col cols="120">
      <!-- 資料表格 -->
      <v-data-table
        :headers="headers"
        :items="allUsers"
        :search="search"
        :page.sync="page"
        :items-per-page="itemsPerPage"
        :loading="loadingUser"
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
              <v-btn icon @click="getAllUsers">
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
            {{ userIndex > -1 ? '修改' : '新增' }}會員
          </span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="10">
                <v-text-field
                  v-model.trim="editingUser.account"
                  :disabled="userIndex > -1"
                  label="帳號*"
                  type="text"
                  :rules="[rules.validNullString]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-if="userIndex === -1"
                  v-model.trim="editingUser.password"
                  label="新密碼*"
                  :rules="[rules.validNullString]"
                  type="password"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-if="userIndex === -1"
                  v-model.trim="editingUser.passwordConfirm"
                  label="確認密碼*"
                  :rules="[rules.validNullString]"
                  type="password"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.trim="editingUser.name"
                  label="姓名*"
                  type="text"
                  :rules="[rules.validNullString]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.trim="editingUser.email"
                  label="信箱*"
                  :rules="[rules.validNullString]"
                  type="text"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.trim="editingUser.phone"
                  label="電話"
                  type="text"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editingUser.gender"
                  :items="[
                    { key: '男', value: 'male' },
                    { key: '女', value: 'female' },
                    { key: '不公開', value: 'hide' },
                  ]"
                  label="性別*"
                  item-text="key"
                  item-value="value"
                  hide-details="true"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-dialog
                  ref="birthSelEl"
                  v-model="birthSel"
                  :return-value.sync="editingUser.birth"
                  persistent
                  width="290px"
                >
                  <template #activator="{ on, attrs }">
                    <v-text-field
                      v-model="editingUser.birth"
                      label="生日"
                      readonly
                      v-bind="attrs"
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="editingUser.birth"
                    locale="zh-tw"
                    scrollable
                  >
                    <v-spacer></v-spacer>
                    <v-btn text color="primary" @click="birthSel = false"
                      >取消</v-btn
                    >
                    <v-btn
                      text
                      color="primary"
                      @click="$refs.birthSelEl.save(editingUser.birth)"
                      >選擇</v-btn
                    >
                  </v-date-picker>
                </v-dialog>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editingUser.scope"
                  :items="[
                    { key: '管理員', value: 'admin' },
                    { key: '顧客', value: 'customer' },
                  ]"
                  label="權限*"
                  item-text="key"
                  item-value="value"
                  hide-details="true"
                  required
                ></v-select>
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
        <v-card-text>確定要刪除這個使用者？</v-card-text>
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
      pageTitle: '會員管理',
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
        { text: '帳號', value: 'account' },
        { text: '姓名', value: 'name' },
        { text: '信箱', value: 'email' },
        { text: '電話', value: 'phone' },
        {
          text: '性別',
          value: 'gender',
          filter: (value) => {
            if (!this.filter.genders.length) return true
            return this.filter.genders.includes(value)
          },
        },
        { text: '生日', value: 'birth' },
        {
          text: '權限',
          value: 'scope',
          filter: (value) => {
            if (!this.filter.scopes.length) return true
            return this.filter.scopes.includes(value)
          },
        },
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
      deleteDialog: false,
      defaultUser: {
        account: '',
        password: '',
        passwordConfirm: '',
        name: '',
        phone: '',
        gender: 'male',
        birth: null,
        scope: 'customer',
      },
      editingUser: { ...this.defaultUser },
      userIndex: -1,
      birthSel: false,
    }
  },
  computed: {
    ...mapGetters('user', ['allUsers', 'loadingUser']),
  },
  created() {
    this.getAllUsers()
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  methods: {
    ...mapActions('user', [
      'getAllUsers',
      'createUser',
      'updateUser',
      'deleteUser',
    ]),
    // 增刪改查操作
    close() {
      this.defaultDialog = false
      this.deleteDialog = false
      this.userIndex = -1
      this.editingUser = { ...this.defaultUser }
    },
    delConfirm() {
      this.deleteUser(this.editingUser)
      this.close()
    },
    del(item) {
      this.deleteDialog = true
      this.userIndex = item.id
      this.editingUser = { ...item }
    },
    edit(item) {
      this.defaultDialog = true
      this.userIndex = item.id
      this.editingUser = { ...item }
      this.editingUser.birth = !item.birth ? null : item.birth.split('T')[0]
    },
    create() {
      this.defaultDialog = true
      this.editingUser = { ...this.defaultUser }
    },
    save() {
      if (this.userIndex > -1) this.updateUser(this.editingUser)
      else this.createUser(this.editingUser)
      this.close()
    },
  },
}
</script>
