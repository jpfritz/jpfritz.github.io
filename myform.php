<html>
    <head>
        <title>My Form</title>
    </head> 
    <body> 
        <form method="post" action="myform.php" > 
            <label for="yourname">What is your name?</label>
            <input id="yourname" name="yourname" type="text" /> 
            <input name="submit" type="submit" value="Send" /> 
        </form>
        
        <?php
    if(isset($_POST['submit'])) 
    { 
        echo 'Hello ' . $_POST['yourname']; 
    }
        ?>
        
    </body> 
</html>

