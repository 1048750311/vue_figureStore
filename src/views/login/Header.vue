<template>
	<header>
		<div @click='goBack'>
			<i class='iconfont'>&#xe604;</i>
		</div>
		<div>
			<slot>
				<span>登录</span>
			</slot>
		</div>
		<div>
			<i class="iconfont">&#xe625;</i>
		</div>
	</header>
</template>

<script>
export default{
	methods:{
		goBack(){
			this.$router.back();
		}
	}
}
</script>

<style scoped lang="scss">
header{
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	height: 1.173333rem;
	color:#fff;
	background-color: #1296db;
	span{
		font-size:0.48rem;
	}
	i{
		padding:0 0.4rem;
		font-size:0.586666rem;
	}
}
</style>
