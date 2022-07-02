<template>
	<div class='detail'>
		<header>
			<div class='header-returns' v-show='isShow'>
				<div @click='goBack'>
					<i class='iconfont'>&#xe604;</i>
				</div>
				<div>
					<i class='iconfont'>&#xe625;</i>
				</div>
			</div>

			<div class='header-bar' v-show='!isShow' :style='styleOption'>
				<div @click='goBack'>
					<i class='iconfont'>&#xe604;</i>
				</div>
				<div>
					<span>商品详情</span>
					<span>商品评价</span>
				</div>
				<div>
					<i class='iconfont'>&#xe625;</i>
				</div>
			</div>
		</header>
		<section ref='wrapper'>
			<div>
				<div class='swiper-main'>
					<swiper :options="swiperOption">
						<swiper-slide v-for='(item, index) in swiperList' :key='index'>
							<div @click="openImg(item.imgUrl, index)">
								<img :src="item.imgUrl" alt="">
							</div>
						</swiper-slide>
					</swiper>
					<div class="swiper-pagination"></div>
				</div>
				<div class='goods-name'>
					<h1>{{ goods.name }}</h1>
					<div>{{ goods.content }}</div>
				</div>
				<div class='goods-price'>
					<div class='oprice'>
						<span>¥</span>
						<b>{{ goods.price }}</b>
					</div>
					<div class='pprice'>
						<span>价格:</span>
						<del>¥9999</del>
					</div>
				</div>
				<div>
					<img style='width:100%;height: 450px;' :src="goods.imgUrl" alt="">
					<img style='width:100%;height: 450px;' :src="goods.imgUrl" alt="">
				</div>
			</div>
		</section>
		<div class="postion"></div>
		<van-goods-action class="footer">
			<van-goods-action-icon icon="chat-o" text="客服" @click="onClickIcon('客服')" />
			<van-goods-action-icon icon="shop-o" text="店铺" @click="onClickIcon('店铺')" />
			<van-goods-action-button color="#66ccff" type="warning" @click="addCart" text="加入购物车" />
			<van-goods-action-button color="#7232dd" type="danger" text="立即购买" @click="onClickIcon('立即购买')" />
		</van-goods-action>
	</div>
</template>

<script>
import 'swiper/dist/css/swiper.css'
import { swiper, swiperSlide } from 'vue-awesome-swiper'
import BetterScroll from 'better-scroll'
import http from '@/common/api/request.js'
import { Toast } from 'mint-ui';
import { ImagePreview } from "vant";
export default {
	data() {
		return {
			id: 0,
			goods: {},
			styleOption: {},
			BetterScroll: '',
			isShow: true,
			swiperOption: {
				autoplay: 3000,
				speed: 1000,
				loop: true,
				pagination: {
					el: '.swiper-pagination',
					type: 'fraction'
				}
			},
			swiperList: []
		}
	},
	components: {
		swiper,
		swiperSlide
	},
	created() {

		this.id = this.$route.query.id;

		this.getData();
	},
	mounted() {
		this.BetterScroll = new BetterScroll(this.$refs.wrapper, {
			probeType: 3,
			bounce: false,
			click: true,
			disableMouse: false,
			disableTouch: false
		})
		this.BetterScroll.on('scroll', (pos) => {
			let posY = Math.abs(pos.y);
			let opacity = posY / 180;

			opacity = opacity > 1 ? 1 : opacity;

			this.styleOption = {
				opacity: opacity
			}

			if (posY >= 50) {
				this.isShow = false;
			} else {
				this.isShow = true;
			}
		})
	},
	activated() {

		//判断当前url , id和之前id是否一致
		if (this.$route.query.id != this.id) {
			this.getData();
			this.id = this.$route.query.id;
		}

	},
	methods: {
		async getData() {
			let id = this.$route.query.id;
			let res = await http.$axios({
				url: '/api/goods/id',
				params: {
					id
				}
			})
			this.goods = res;
			this.swiperList = [
				{
					imgUrl: this.goods.imgUrl
				},
				{
					imgUrl: './images/goods5.jpg'
				},
				{
					imgUrl: './images/goods6.jpg'
				},
				{
					imgUrl: './images/goods7.jpg'
				}
			],
				this.swiperList1 = [
					{
						imgUrl: this.goods.imgUrl
					},
				]
		},
		//加入购物车
		addCart() {
			let id = this.$route.query.id;
			let userInfo1 = JSON.parse(localStorage.getItem('UserInfo'));

			if (userInfo1) {
				http.$axios({
					url: '/api/addCart',
					method: "post",
					data: {
						goodsId: id
					},
					headers: {
						token: true
					}
				}).then(res => {
					if (res.success) {
						Toast('添加购物车成功');
					}
				})
			} else {
				Toast('当前未登录');
				console.log('123123123');

				this.$router.push('/login')
			}
		},
		//返回上一页
		goBack() {
			this.$router.back();
		},
		openImg(item, index) {
			var arr = new Array();
			this.swiperList.forEach((item) => {
				arr.push(item.imgUrl);
			})
			ImagePreview({
				images: arr,
				showIndex: true,
				loop: true,
				startPosition: index,
				closeable: true,
			});
		},
		onClickIcon(text) {
			console.log(text)
			Toast(`你点击了${text}图标`);
		},
	}
}
</script>

<style scoped lang="scss">
.detail {
	display: flex;
	flex-direction: column;
	width: 100vw;
	height: 100vh;
	overflow: hidden;
}

header {
	position: fixed;
	left: 0;
	top: 0;
	z-index: 999;
	width: 100%;
	height: 1.173333rem;

	.header-returns {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		height: 1.173333rem;

		div {
			margin: 0 0.266666rem;
			width: 0.933333rem;
			line-height: 0.906666rem;
			text-align: center;
			background-color: rgba(0, 0, 0, 0.3);
			border-radius: 50%;
		}

		i {
			font-size: 0.693333rem;
			color: #fff;
		}
	}

	.header-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		height: 1.173333rem;
		font-size: 0.426666rem;
		background-color: #66ccff;

		span {
			padding: 0 0.266666rem;
		}

		i {
			padding: 0 0.266666rem;
			font-size: 0.586666rem;
		}
	}
}

section {
	flex: 1;
	overflow: hidden;
}

.swiper-main {
	position: relative;
	width: 100%;
	height: 10rem;
	overflow: hidden;
}

.swiper-container {
	width: 100%;
	height: 10rem;
}

.swiper-container img {
	width: 100%;
	height: 10rem;
}

.swiper-pagination {
	bottom: 0.266666rem;
	width: 100%;
	text-align: right;
	color: #FFFFFF;
	font-size: 0.426666rem;
}

.swiper-pagination-fraction,
.swiper-pagination-custom,
.swiper-container-horizontal>.swiper-pagination-bullets {
	left: -0.533333rem;
}

.goods-name {
	padding: 0.533333rem 0.266666rem;
	border-bottom: 1px solid #CCCCCC;

	h1 {
		font-size: 0.533333rem;
		font-weight: 500;
	}

	div {
		padding: 0.08rem 0;
		font-size: 0.373333rem;
		color: #999999;
	}
}

.goods-price {
	padding: 0.533333rem 0.266666rem;

	.oprice {
		color: red;

		span {
			font-size: 0.32rem;
		}
	}

	.pprice {
		color: #999999;
		font-size: 0.373333rem;
	}
}

footer {
	display: flex;
	justify-content: center;
	align-items: center;
	position: fixed;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 1.306666rem;
	border-top: 1px solid #cccccc;
	background-color: #fff;
}
.postion{
	height: 1.3333rem;
}
</style>
