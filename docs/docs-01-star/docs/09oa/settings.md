# 个人设置

## 业务设计范围

![2024-10-15-20-38-27](https://s2.loli.net/2024/10/15/gbUsaTWFAQzSf1h.png)

## 设置首页

这是一个 tab 栏的设置页

![2024-10-15-20-39-39](https://s2.loli.net/2024/10/15/brceNZaDFfASskL.png)

分为三个组件，作为 tab 页面。

个人信息设置页

常用意见设置页

只做两个页面。单点登录不做。不认为本次项目能够做到单点登录的配置。

组件 `person-settings.vue`

### 获取个人信息

在本页面的开始生命周期内，做接口请求。或者是从全局 pinia 内获取存储在浏览器内的个人数据即可。

## 个人信息设置页

设计一个居中的表单即可

`person-info-settings.vue`

![2024-10-15-20-43-34](https://s2.loli.net/2024/10/15/szo129JM8YVejgd.png)

### 保存个人信息

调接口。

存储一次用户信息。

### 获得短信验证码

原型是没有的。要多做一个按钮。实现获取短信验证码。

或者是不校验。校验的功能放在其他地方。

## 个人头像上传弹框

一个头像上传表单。去百度抄一个拖拽上传图片的功能。

`person-info-profile-upload-dialog.vue`

![2024-10-15-20-44-06](https://s2.loli.net/2024/10/15/VUdQjRO41FuAKmz.png)

## 常用意见设置页

对单一的一个字段做设置即可。

`common-advice-setting.vue`

![2024-10-15-20-47-02](https://s2.loli.net/2024/10/15/KNmcBry15uWXoV7.png)

## 手机号修改与验证页

多做一个 tab 页，用来实现手机号的修改与验证。

## 邮箱修改与验证页

类似于上面的页面。

## 修改密码页
