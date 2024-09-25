Server-rendered snake game

In current implementation every user can see same field and everyone can control that snake. 

But game completely rendered on server and user doesn't have an option to trick the game. user can use keybourd arrows to change direction

start game with
```npm run start```

open in browser http://localhost:3000/ to control the snake

For our case we have to add authorization and sessions and mupliple fields so each user can use own field

Also have to implement game start/game and option to save results.