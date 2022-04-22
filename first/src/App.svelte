<script lang="ts">
    import {onMount} from 'svelte';
    let sum:number = 0;
    let texts:string[] = [];
    const plus = (form) => { 
        form.count += 1;
        forms = forms;
        sum = forms.reduce((pre,cur)=>pre+cur.count,0);   
    };
    const minus = (form) => { 
        if(form.count > 0)form.count -= 1;
        forms = forms;
        sum = forms.reduce((pre,cur)=>pre+cur.count,0); 
    };
    const zero = (form) => { 
        form.count = 0;
        forms = forms;
        sum = forms.reduce((pre,cur)=>pre+cur.count,0); 
    };
    let text: string = 'new';
    let forms = [
        {text: "new", count: 0},
    ]
    const onChangeInput = (index, form) => {
        texts[index] = form.text;
        texts = texts;
    };
    function increase() {
        forms.push({ text:"new", count: 0 });
        forms = forms;
        texts.push(text);
        texts = texts;
    };
    const decrease = (index,form) => {
    	forms = forms.filter((_, i) => i !== index);
        form.count = 0;
        forms = forms;
        sum = forms.reduce((pre,cur)=>pre+cur.count,0);
        texts = texts.filter((_, i) => i !== index);
    };
    onMount(() => {
        texts.push(text);
        texts = texts;
    })

</script>

<main>
    <p style="font-size:4em" class="subject">Multiple Counter</p>
        {#each forms as form,index}
            <div class="form">
                <div style="float:left">
                    <input on:keyup={() => onChangeInput(index, form)} type="text" class="input" bind:value = {form.text}>
                </div>
                <div style="text-align:center"><p class="number" >{form.count}</p></div>
                <div class="func">
                    <button on:click={() => plus(form)} style="background:#F56565" >+</button>
                    <button on:click={() => minus(form)} style="background:#4299E1" >-</button>
                    <button on:click={() => zero(form)} style="background:#ECC94B" >0</button>
                    <button style="border-color:transparent" on:click= {() => decrease(index, form)}>x</button>
                </div>
            </div>
        {/each}
    
    <input type="button" value = "new counter" class="addButton" on:click= {increase} >
    <p style="margin:0">title list:{texts}</p>
    <p style="margin:0">sum of count:{sum}</p>
    
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
    input.addButton{
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