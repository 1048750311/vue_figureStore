<template>
  <div id="app">

    <!--要  缓存的路由-->
    <keep-alive>
      <router-view v-if="$route.meta.keepAlive"></router-view>
    </keep-alive>

    <!--不  缓存的路由-->
    <router-view v-if="!$route.meta.keepAlive"></router-view>


  </div>
</template>

<script>
export default {
  created() {
    this.$store.commit('initUser');
  }
}
</script>
<style>
@font-face {
  font-family: 'iconfont';  /* Project id 3417754 */
  src: url('//at.alicdn.com/t/font_3417754_b435lhpmwcw.woff2?t=1653512020009') format('woff2'),
       url('//at.alicdn.com/t/font_3417754_b435lhpmwcw.woff?t=1653512020009') format('woff'),
       url('//at.alicdn.com/t/font_3417754_b435lhpmwcw.ttf?t=1653512020009') format('truetype');
}

.iconfont {
  font-family: "iconfont" !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>