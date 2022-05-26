<template>
	<div class='recommend'>
		<van-notice-bar left-icon="volume-o" :scrollable="false" class="notice" color="#1989fa" background="#ecf9ff">
			<van-swipe vertical class="notice-swipe" :autoplay="3000" :show-indicators="false">
				<van-swipe-item>今日热点：四川雅安4.8级地震 成都震感强烈</van-swipe-item>
				<van-swipe-item>爱死机第三季上线啦！！</van-swipe-item>
				<van-swipe-item>测试数据：This is a test imformation</van-swipe-item>
			</van-swipe>
		</van-notice-bar>

		<Card></Card>
		<ul>
			<li v-for='(item, index) in recommendList' :key='index'>
				<h2>
					<img :src="item.imgUrl" alt="">
				</h2>
				<div class="content">
					<h3>{{ item.name }}</h3>
					<p>{{ item.content }}</p>
					<div class='price'>
						<span>¥</span>
						<i>{{ item.price }}</i>
					</div>
				</div>
			</li>
		</ul>
	</div>
</template>

<script>
import Card from '@/components/home/Card.vue'
export default {
	data() {
		return {
			recommendList: [
				{
					id: 1,
					name: 'Hobbymax 新世纪福音战士 绫波零 Radio Eva Ver.手办 再版',
					content: '新世纪福音战士 Hobbymax榜No.1',
					price: '758',
					imgUrl: './images/recommend1.png'
				},
				{
					id: 2,
					name: '明日方舟 W 手办 附独家特典',
					content: '附独家特典:W原画海报捏',
					price: '749',
					imgUrl: './images/recommend2.png'
				}
			]
		}
	},
	components: {
		Card
	}
}
</script>

<style scoped>
.notice{
	box-shadow: 0 0 0.12rem rgb(0 0 0 / 30%);
}
.recommend ul li {
	display: flex;
	justify-content: space-between;
	margin: 0.2rem;
	padding: 0.3rem 0.4rem;
	border-radius: 0.2rem;
	box-shadow: 0 0 0.12rem rgb(0 0 0 / 10%);
	overflow: hidden
}

.recommend ul li h2 {
	width: 2.5rem;
	height: 2.8rem;
	border-radius: 0.1rem;
	overflow: hidden;
}

.recommend ul li img {
	width: 100%;
	height: 100%;
	border-radius: 12px;
}

.recommend ul li .content {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding-left: 0.4rem;
	color: #000;
	font-size: 0.4rem;
	overflow: hidden;
}

.recommend ul li .content h3 {
	width: 6rem;
	align-self: flex-start;
	font-size: 0.4rem;
	text-overflow: ellipsis;
	white-space: nowrap;
	overflow: hidden;
}

.recommend ul li .content p {
	width: 6rem;
	align-self: flex-start;
	color: #555;
	font-size: 0.36rem;
	text-overflow: ellipsis;
	white-space: nowrap;
	overflow: hidden;
}

.recommend ul li .content .price {
	align-self: flex-end;
	margin-top: 0.72rem;
	color: #ff0000;
	font-size: 0.6rem;
}


.price span {
	font-size: 0.373333rem;
}

.recommend ul li .content .price i {
	font-size: 0.6rem;
}

.notice-swipe {
	height: 40px;
	line-height: 40px;
}
</style>
