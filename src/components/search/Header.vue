<template>
	<header>
		<div class='search-return' @click='goBack'>
			<i class='iconfont'>&#xe604;</i>
		</div>
		<div class='search-main'>
			<i class='iconfont'>&#xe623;</i>
			<form action="" onsubmit="return false" @keyup.enter='goSearchList'>
				<input type="search" placeholder="搜索您喜欢的产品..." v-model='searchVal'>
			</form>
		</div>
		<div class='serach-btn' @click='goSearchList'>搜索</div>
	</header>
</template>

<script>
export default {
	data() {
		return {
			searchVal: this.$route.query.key || '',
			searchArr: [],
			timer: null,
		}
	},
	methods: {
		goBack() {
			this.$router.back();
		},
		goSearchList() {
			//如果搜索的关键字是没有的，那就直接return
			//判断之前有没有搜索的本地存储
			clearTimeout(this.timer);
			this.timer = setTimeout(() => {
				// 执行搜索请求
				if (!localStorage.getItem('searchList')) {
					//没有
					localStorage.setItem('searchList', '[]');
				} else {
					//之前有
					this.searchArr = JSON.parse(localStorage.getItem('searchList'));
				}

				if (this.searchVal) {
					//增加数据
					this.searchArr.unshift(this.searchVal);
					//ES6去重
					let newArr = new Set(this.searchArr);
					//给本地存储赋值
					localStorage.setItem('searchList', JSON.stringify(Array.from(newArr)));
				}
				//路径如果没有变化，不跳转页面
				if (this.searchVal === this.$route.query.key) return;
				//跳转页面
				this.$router.push({
					name: 'list',
					query: {
						key: this.searchVal
					}
				})
			}, 600); // 设置时间

		}
	}
}
</script>

<style scoped>
header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	height: 1.2rem;
	color: #000;
	background-color: #1296db;
}

.search-return,
.serach-btn {
	padding: 0 0.266666rem;
}

.search-return i {
	font-size: 0.746666rem;
}

.search-main {
	display: flex;
	align-items: center;
	width: 6.933333rem;
	height: 0.8rem;
	border-radius: 12px;
	background-color: #FFFFFF;
}

.search-main i {
	padding: 0 0.266666rem;
	color: #666666;
}

.search-main form {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
}

.search-main form input {
	width: 100%;
	font-size: 0.4rem;
}

.serach-btn {
	font-size: 0.426666rem;
}
</style>