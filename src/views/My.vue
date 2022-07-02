<template>
	<div class='my container'>
		<header>

			<div class='user-info' v-if='loginStatus'>
				<img :src="userInfo.imgUrl" alt="">
				<span>{{ userInfo.nickName }}</span>
			</div>
			<div v-else class='login' @click='goLogin'>登录/注册</div>

		</header>
		<div class="sort_icons">
			<ul>
				<li>
					<i class="iconfont" @click="onClickIcon('我的订单')">&#xe645;</i>
					<span>我的订单</span>
				</li>
				<li>
					<i class="iconfont" @click="onClickIcon('购物车')">&#xe899;</i>
					<span>购物车</span>
				</li>
				<li>
					<i class="iconfont" @click="onClickIcon('收藏店铺')">&#xe63d;</i>
					<span>收藏店铺</span>
				</li>
				<li>
					<i class="iconfont" @click="onClickIcon('收藏商品')">&#xe63d;</i>
					<span>收藏商品</span>
				</li>
				<li>
					<i class="iconfont" @click="onClickIcon('优惠券')">&#xe645;</i>
					<span>优惠券</span>
				</li>
				<li>
					<i class="iconfont" @click="onClickIcon('附近')">&#xe61f;</i>
					<span>附近</span>
				</li>
				<li>
					<i class="iconfont" @click="onClickIcon('充值')">&#xe63d;</i>
					<span>充值</span>
				</li>
				<li>
					<i class="iconfont" @click="onClickIcon('好友')">&#xe783;</i>
					<span>好友</span>
				</li>
			</ul>
		</div>
		<section>
			<ul>
				<li @click='goPath'>地址管理</li>
				<li v-if='loginStatus' @click='loginOut'>退出登录</li>
			</ul>
		</section>
		<Tabbar></Tabbar>
	</div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import Tabbar from '@/components/common/Tabbar.vue'
import { Toast } from 'vant';
export default {
	name: "My",
	components: {
		Tabbar
	},
	computed: {
		...mapState({
			loginStatus: state => state.user.loginStatus,
			userInfo: state => state.user.userInfo
		})
	},
	methods: {
		...mapMutations(['loginOut']),
		goLogin() {
			this.$router.push('/login');
		},
		//进入地址管理
		goPath() {
			if (!this.loginStatus) {
				Toast("请登录再修改");
			}
			this.$router.push('/path');
		},
		onClickIcon(text) {
			console.log(text)
			Toast(`${text}模块暂未开发`);
		},
	}
};
</script>
<style scoped lang='scss'>
header {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 4.266666rem;
	background-color: #1296db;

	.login {
		padding: 0.16rem 0.4rem;
		font-size: 0.426666rem;
		color: #fff;
		background-color: #F6AB32;
		border-radius: 6px;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		img {
			width: 1.76rem;
			height: 1.76rem;
			border-radius: 50%;
		}

		span {
			padding: 0.533333rem 0;
			font-size: 0.48rem;
			color: #fff;
		}
	}
}

.sort_icons {

	margin-bottom: 0.36rem;
	padding: 0.36rem;
	width: 100%;
	height: auto;
	color: #1296db;
	box-shadow: 0 0.1rem 0.1rem -0.1rem rgba(0, 0, 0, 0.1);
	border-radius: 0 0 0.72rem 0.72rem;
	overflow: hidden;
	box-sizing: border-box;

	ul {
		display: flex;
		flex-wrap: wrap;

		li {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			width: 25%;
			height: 1.8rem;

			i {
				font-size: 0.72rem;
			}

			span {
				margin-top: 0.16rem;
				font-size: 0.4rem;
			}
		}
	}
}

section {
	flex: 1;
	overflow: hidden;

	ul li {
		padding: 0.4rem;
		font-size: 0.426666rem;
	}
}
</style>
