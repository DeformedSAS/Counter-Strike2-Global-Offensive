
# CS2:GO, A mod that adds some CS2 features and content to CS:GO.

# MainMenu
- All of the core UI changes.
![image](https://github.com/user-attachments/assets/2fa96441-985f-42ae-9e0d-7c4ee86adbfa)

![image](https://github.com/user-attachments/assets/14b11c50-e829-421e-a166-ea2ad2503dfe)

![image](https://github.com/user-attachments/assets/b7315c10-dcb2-41a9-8a99-84174424f2e5)

![image](https://github.com/user-attachments/assets/2fd70ece-3331-4da6-ac43-c7394ed8d159)

![image](https://github.com/user-attachments/assets/82708236-5446-439d-a7d2-ad2fa2fcc45b)

![image](https://github.com/user-attachments/assets/6335d313-aaa6-434d-b838-50255efd8331)

# HUD
![image](https://github.com/user-attachments/assets/e3978af6-ad29-44b8-8c71-013986d21729)

![image](https://github.com/user-attachments/assets/7e7071d0-69b0-4b34-9042-f22cd43082c5)

![image](https://github.com/user-attachments/assets/091ee25e-17fd-4e1b-b33a-db5a0b0cf874)

# Credits
- crazymodder and others who worked on porting CS2 weapons to CS:GO. And for giving me permission to use the kukri knife and taser models in this addon!
- d3gk for helping me resolve some issues.
- roblogez for suggestions for hud and improving general code optimisation.
- Valve, CS2 Developer Team for making the awesome clean ui.
- And me DeformedSAS for basically backporting the entire UI..
- ZooL for giving me permission to use his reworked molotov. All he said was do whatever when i asked him so.. I guess it's a yes?
- Aluminum Lodide, PROm and ZaihnY for the Scar17 model and textures.

# Installation and Requirements
- You are required to use HLAE!
- HLAE panorama loader [panorama.my.zip](https://github.com/user-attachments/files/17939965/panorama.my.zip)

# How to install?
- Download HLAE First. Run HLAE, paste the panorama zip file linked above into %appdata%\hlae
- Download the cs2go zip file from releases tab and extract it where csgo.exe is
- In HLAE go to Tools > Developer > Custom Loader and find your CS:GO install. Then paste these launch options: -language cs2panorama -game cs2go/csgo -afxdetourpanorama
- If done correctly you should hear the CS2 startup logo and the custom UI should work.
- That's it! Have fun playing with this UI!

# QNA


  -  Does this cause VAC bans? - No this does not cause any VAC bans as it does not change CS:GO's binary code, however you should be aware that this requires HLAE and using any modified version of HLAE to play the game in secure mode will also most likely not give you a ban as long as you don't use any demo features.

-  When will a new update come? - When it's ready
  
-  Will you add this or that - Depends if it's directly from CS2 such as items or some UI Panel elements.

-  I still have the normal CS:GO panorama ui when i start the game with HLAE - Make sure that you followed the tutorial on the bottom of the github page properly

-  Will this be a seperate game and not a mod for migi? - Well currently the mod is being worked on as a non migi addon as migi has it's own issues that somewhat limits this, what exactly you might ask? Music kit sound scripts will not work so if you win a round with a CS2 music kit that you have, you won't hear anything as it can't find the sound event. With the non migi addon version of the mod, you will have all CS2 music kit sound events and they will play properly.

-  Will you make a matchmaking service - That is planned to be done at some point. No ETA

-  When did this project start? - Around october 2023 after CS2's release and has gotten under 2 full rewrites since.

-  Will you add this bug fix that i made? - Yes, any help is very appreciated, just make a pull request with the modified code that you provide and I'll check it out.

### If you have any questions, ask me and i'll provide information for them.
