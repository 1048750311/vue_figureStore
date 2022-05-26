<template>
	<div class='swiper-main'>
		<swiper :options="swiperOption">
		  <swiper-slide 
			v-for='(item,index) in swiperList' 
			:key='index'
		   >
			<img :src="item.imgUrl" alt="">
		  </swiper-slide>
		</swiper>
		<div class="swiper-pagination"></div> 
	</div>
</template>

<script>
import 'swiper/dist/css/swiper.css'
import { swiper, swiperSlide } from 'vue-awesome-swiper'
export default {
  name: 'Swiper',
  props:{
	swiperList:Array
  },
  data(){
    return{
		swiperOption: {//swiper3
			loop:true,
            autoplay: {
              delay: 3000,
              stopOnLastSlide: false,
              disableOnInteraction: false,
            },
			speed: 1000,
			pagination: {
				el: '.swiper-pagination'
			}
		}
    }
  },
  components: {
    swiper,
    swiperSlide
  },
}
</script>

<style scoped>
.swiper-main{
	position: relative;
	width: 100%;
	height: 6rem;
}
.swiper-container{
	width: 100%;
	height: 6rem;
}
.swiper-main img{
	width: 100%;
	height: 6rem;
}
.swiper-pagination{
	width: 100%;
	bottom:0px;
}
::v-deep .swiper-pagination-bullet-active{
	background-color: #1989fa;
}
::v-deep .swiper-pagination-bullet{
	margin:0 0.08rem;
}
</style>
