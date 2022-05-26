<template>
	<div class='title'>
		<slot>
			<span>爆款推荐</span>
		</slot>
	</div>
</template>

<script>
</script>

<style scoped>
.title{
	padding:0.266666rem 0;
	width: 100%;
	text-align: center;
	font-size: 0.426666rem;
    background-color: whitesmoke;
}
.title span{
	position: relative;
}
.title span::after{
	content: "";
	display: block;
	position: absolute;
	right: -0.5rem;
	top: 50%;
	margin-top: -4px;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #1296db;
	
}
.title span::before{
	content: "";
	display: block;
	position: absolute;
	top: 50%;
	left: -0.5rem;
	margin-top: -4px;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #1296db;
}
</style>
