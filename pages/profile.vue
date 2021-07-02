<template>
  <v-row class="d-flex justify-center">
    <v-col cols="12" class="text-center">
      <v-avatar class="mb-n16" style="z-index: 1" color="accent" size="128">
        <span v-if="!user.avatar" class="text-h3">{{
          user.name ? user.name[0] : ''
        }}</span>
        <v-img
          v-if="user.avatar"
          class="rounded-lg"
          :src="`http://localhost:3000/api/avatar?p=${user.avatar}`"
          aspect-ratio="1"
        ></v-img>
      </v-avatar>
    </v-col>
    <v-col cols="12" sm="8" md="6" lg="4">
      <v-card>
        <v-card-title class="justify-space-between pb-0">
          <v-btn icon @click="edit">
            <v-icon>mdi-cog</v-icon>
          </v-btn>
          <v-btn icon @click="avatarDialog = true">
            <v-icon>mdi-camera-plus</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-title class="justify-center">
          {{ user.name }}
        </v-card-title>
        <v-card-subtitle class="text-center">
          {{ user.account }}
        </v-card-subtitle>

        <v-card-text>
          <v-container>
            <!-- 個人資料區 -->
            <div v-for="(item, key) in items" :key="key">
              <v-list-item>
                <v-list-item-avatar>
                  <v-icon>{{ item.icon }}</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>{{ item.content }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </div>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-col>

    <!-- 修改表單對話框 -->
    <v-dialog v-model="editDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">修改個人資料</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="10">
                <v-text-field
                  v-model.trim="editingUser.account"
                  :disabled="true"
                  label="帳號"
                  type="text"
                  required
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

    <!-- 上傳表單對話框 -->
    <v-dialog v-model="avatarDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">上傳個人照片</span>
        </v-card-title>
        <v-card-text>
          <v-container class="text-center">
            <v-avatar class="mb-2" color="accent" size="128">
              <v-img class="rounded-lg" :src="url" aspect-ratio="1"></v-img>
            </v-avatar>
            <v-file-input
              v-model="avatarFile"
              :rules="[rules.validAvatar]"
              label="選擇照片"
              accept="image/png, image/jpeg, image/bmp"
              filled
              prepend-icon="mdi-camera"
              @change="changeAvater"
            ></v-file-input>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="close">關閉</v-btn>
          <v-btn color="blue darken-1" text @click="upload">上傳</v-btn>
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
      pageTitle: '個人資料',
      rules: {
        validNumber: (v) => v > 0 || '必須大於0',
        validNullString: (v) => !!v || '不能為空',
        validAvatar: (v) => !v || v.size <= 2000000 || '圖片大小不能超過2MB!',
      },
      avatarDialog: false,
      editDialog: false,
      editingUser: {},
      birthSel: false,
      avatarFile: {},
      url: '',
    }
  },
  computed: {
    ...mapGetters('profile', ['user']),
    items() {
      return [
        {
          icon: 'mdi-email',
          title: '信箱',
          content: this.user.email || null,
        },
        {
          icon: 'mdi-phone',
          title: '電話',
          content: this.user.phone || null,
        },
        {
          icon: 'mdi-gender-male-female',
          title: '性別',
          content:
            this.user.gender === 'male'
              ? '男'
              : this.user.gender === 'female'
              ? '女'
              : '不公開',
        },
        {
          icon: 'mdi-cake-variant',
          title: '生日',
          content: !this.user.birth ? null : this.user.birth.split('T')[0],
        },
      ]
    },
  },
  created() {
    const id = this.$store.getters.user.id
    this.getUser(id)
    this.$nuxt.$emit('pageTitle', this.pageTitle)
  },
  methods: {
    ...mapActions('profile', ['getUser', 'updateProfile', 'uploadAvatar']),
    ...mapActions(['reGetMe']),
    // 增刪改查操作
    close() {
      this.avatarDialog = false
      this.editDialog = false
      this.editingUser = {}
    },
    edit() {
      this.editDialog = true
      this.editingUser = { ...this.user }
      this.editingUser.birth = !this.user.birth
        ? null
        : this.user.birth.split('T')[0]
    },
    save() {
      this.updateProfile(this.editingUser)
      this.reGetMe()
      this.close()
    },
    upload() {
      const formData = new FormData()
      formData.append('avatar', this.avatarFile)
      formData.append('id', this.user.id)
      this.uploadAvatar(formData)
      this.reGetMe()
      this.close()
    },
    changeAvater() {
      if (this.avatarFile) {
        const reader = new FileReader()
        reader.readAsDataURL(this.avatarFile)
        reader.onload = () => {
          this.url = reader.result
        }
      } else {
        this.url = ''
      }
    },
  },
}
</script>
