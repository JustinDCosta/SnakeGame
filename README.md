# Classic Snake

A modern, highly-polished web implementation of the classic Snake arcade game. Built from the ground up using raw HTML5 Canvas, CSS3, and JavaScript, ensuring a deeply embedded, buttery-smooth experience across both desktop and mobile devices. 

There are no external frameworks or confusing installation steps. It is a completely static, standalone app.

## Features

- **Responsive Full-screen Gameplay:** The grid automatically recalculates and fits perfectly to any screen size or resized browser window in real-time.
- **Wall Wrapping:** Hit a wall? No problem. The snake phases right through and reappears on the opposite edge.
- **Seamless Touch / Mobile Controls:** Contains a fully functioning on-screen directional pad explicitly designed for mobile devices.
- **Live Customization:** Use the integrated color picker (in the top bar) to modify the snake's color. The head automatically darkens dynamically based on the body's hex.
- **Save States / Persistent Scores:** Your high score is automatically recorded in the browser's `localStorage`.
- **Keyboard Optimization:** Start the game with your keyboard, play with `W, A, S, D` or `Arrow Keys`, and pause using `P` or `Esc`. 
- **Lightweight Audio Engine:** Utilizes the native Web Audio API for custom synthesized bleeps on collecting food or hitting game over (meaning zero external sound files).

## How to Play

1. **Clone** or download this repository locally.
2. Open `index.html` in any modern web browser (Google Chrome, Firefox, Safari, Edge).
3. Click "PLAY" and enjoy!

### Controls

**On Desktop:**
- `Arrow Up` or `W` to move up.
- `Arrow Down` or `S` to move down.
- `Arrow Left` or `A` to move left.
- `Arrow Right` or `D` to move right.
- `P` or `Esc` to Pause/Resume.

**On Mobile:**
- Tap "PLAY" and use the **On-Screen D-Pad** located at the bottom to navigate. 
- *Note: Touch events suppress screen zooming to prevent layout issues.*

## Project Structure

```text
├── index.html        # Clean, semantic UI structure overlaying the Canvas container.
├── style.css         # Minimalist, modern UI styling and responsive breakpoint mechanics.
├── game.js           # Core game loop, screen painting, controls, collision logic, and sounds.
├── .gitignore        # Secure list to omit IDE or OS-specific clutter.
└── README.md         # The file you are currently reading.
```

## Contributing

Because this project is lightweight and written in Vanilla JavaScript, modifying it is straightforward. Feel free to fork the repository, make variations inside the `draw()` logic (for example, adding brick obstacles or different food types), and submit a Pull Request!

## License

This project is open-source and free to use, modify, and distribute. Have fun!