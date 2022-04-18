<script lang="ts">
	import First from "./first.svelte";
	export let name: string;
	let count:number = 0;
	const plus = () => { count += 1 };
    const minus = () => { count -= 1 };
	$: if(count < 0){
		count += 1;
	};
	const zero = () => { count = 0 };
	let forms = [{ text: 'new' }];
    function increase() {
		forms = forms.concat({ text: 'new' });
	};
	function decrease() {
		forms = forms.slice(1);
	}

</script>

<main>
	<p style="font-size:4em" class="subject">Multiple Counter</p>
	{#each forms as form}
	<div class="form">
		<div style="float:left">
			<input type="text" class="input" placeholder="new" bind:value = {form.text}>
		</div>
		<div style="text-align:center"><p class="number">{count}</p></div>
		<div class="func">
			<button on:click={plus} style="background:#F56565" tabindex="-1">+</button>
			<button on:click={minus} style="background:#4299E1" tabindex="-1">-</button>
			<button on:click={zero} style="background:#ECC94B" tabindex="-1">0</button>
			<button style="border-color:transparent" on:click= {decrease} >x</button>
		</div>
	</div>
	{/each}
	<button type="button" class="addButton" on:click= {increase} >new counter</button>
	<p style="margin:0">title list:</p>
	<p style="margin:0">sum of count:</p>
	<h1>Hello {name}!</h1>
	<First/>
	
</main>

<style>
    main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}
	p.number{
		font-size: 2em;
		margin-top: 0;
		margin-bottom: 0;
		padding-left: 50px;
		
	}
	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}
	div.form {
        width: 400px;
        height: 40px;
        background: #F4F4F4;
		margin: 0 auto;
		box-shadow: 0 0px 15px 0 rgba(119, 117, 117, 0.5) ;
		border-radius: 5px;
		margin-top: 1%;
		display: flex;
	}
	button.addButton{
		margin-top: 1%;
		width: 400px;
		margin-left: auto;
        margin-right: auto ;
		background: #68D391;
		border-radius: 5px;
		outline: none;
	}
	p.subject{
		text-align: center;
		margin: 0;
		font-size: 4em;
	}
	input.input{
		margin: 2%;
		width:150px;
		border-color:transparent;
	}
	div.func{
		margin-left: auto;
		padding-top: 4px;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>