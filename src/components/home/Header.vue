<template>
	<header>
		<h1>
			<img src="@/assets/images/logo3.png" alt="">
			<span>伊藤樱木</span>
		</h1>
		<div class='search' @click='goSearch'>
			<i class='iconfont'>&#xe623;</i>
			<span>搜您喜欢的...</span>
		</div>
		<div class='kefu'>
			<i class='iconfont'>&#xe625;</i>
		</div>
	</header>
</template>

<script>
export default {
	methods: {
		goSearch() {
			this.$router.push('/search')
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
	background-color: #1296DB;
}

header h1 {
	display: flex;
	/* padding:0 0.266666rem; */
	width: 3rem;
	height: 1.2rem;
	justify-content: center;
	align-items: center;
}

header h1 img {
	width: 1rem;
	height: 1rem;
}

header h1 span {
	padding-left: 0.2rem;
	color: #fff;
	font-size: 0.4rem;
}

.search {
	flex: 1;
	display: flex;
	align-items: center;
	width: 5rem;
	height: 0.8rem;
	background-color: #FFFFFF;
	border-radius: 12px;
}

.search i {
	padding: 0 0.16rem;
	color: #ccc;
}

.search span {
	font-size: 0.373333rem;
	color: #ccc;
}

.kefu i {
	font-size: .64rem;
	color: #fff;
	padding-left: 10px;
	padding-right: 10px;
}
</style>