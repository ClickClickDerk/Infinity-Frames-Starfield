function inject() {
            let scene, camera, webGLRenderer, css3DRenderer;
            let orbitControls, flyControls, dragControls, transformControls;
            let gridHelper;
            let isFlyMode = false;
            let gridVisible = true;
            let iframeObjects = [];
            let selectedIframe = null;
            let currentIframeIndex = -1;
            let starSpeed = 2;
            const clock = new THREE.Clock();

            function init() {
                scene = new THREE.Scene();
                camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
                camera.position.set(0, 325, 1500);

                webGLRenderer = new THREE.WebGLRenderer({ antialias: true });
                webGLRenderer.setSize(window.innerWidth, window.innerHeight);
                webGLRenderer.domElement.style.position = 'absolute';
                webGLRenderer.domElement.style.top = '0';
                webGLRenderer.domElement.style.left = '0';
                webGLRenderer.domElement.style.zIndex = '1';
                webGLRenderer.domElement.style.pointerEvents = 'none';
                document.body.appendChild(webGLRenderer.domElement);

                css3DRenderer = new THREE.CSS3DRenderer();
                css3DRenderer.setSize(window.innerWidth, window.innerHeight);
                css3DRenderer.domElement.style.position = 'absolute';
                css3DRenderer.domElement.style.top = '0';
                css3DRenderer.domElement.style.left = '0';
                css3DRenderer.domElement.style.zIndex = '2';
                css3DRenderer.domElement.style.pointerEvents = 'auto';
                document.body.appendChild(css3DRenderer.domElement);

                orbitControls = new THREE.OrbitControls(camera, css3DRenderer.domElement);
                orbitControls.enablePan = true;
                orbitControls.minDistance = 100;
                orbitControls.maxDistance = 5000;

                flyControls = new THREE.FlyControls(camera, css3DRenderer.domElement);
                flyControls.movementSpeed = 1000;
                flyControls.rollSpeed = Math.PI / 24;
                flyControls.autoForward = false;
                flyControls.dragToLook = true;
                flyControls.enabled = false;

                transformControls = new THREE.TransformControls(camera, css3DRenderer.domElement);
                transformControls.addEventListener('change', render);
                scene.add(transformControls);

                transformControls.addEventListener('dragging-changed', function (event) {
                    orbitControls.enabled = !event.value;
                });

                gridHelper = new THREE.GridHelper(2000, 50, 0x00ffff, 0xff00f6);
                gridHelper.material.opacity = 0.5;
                gridHelper.material.transparent = true;
                scene.add(gridHelper);

                document.getElementById('createIframe').addEventListener('click', () => {
                    const src = document.getElementById('iframeSrc').value;
                    const positionX = parseFloat(document.getElementById('positionX').value);
                    const positionY = parseFloat(document.getElementById('positionY').value);
                    const positionZ = parseFloat(document.getElementById('positionZ').value);
                    createIframe(src, 'Iframe', positionX, positionY, positionZ);
                });

                document.getElementById('toggle-mode').addEventListener('click', toggleMode);
                document.getElementById('toggle-grid').addEventListener('click', toggleGrid);
                document.getElementById('delete-iframe').addEventListener('click', deleteSelectedIframe);
                document.getElementById('update-iframe-url').addEventListener('click', updateIframeURL);
                document.getElementById('next-iframe').addEventListener('click', nextIframe);
                document.getElementById('prev-iframe').addEventListener('click', prevIframe);

                // Resize Handling
                window.addEventListener('resize', onWindowResize);
                // Initialize Starfield
                //initStarfield();
                animate();
            }

            function createIframe(src, title, x = 0, y = 1, z = 0, width = 1, height = 0.5) {
                const htmlIframe = document.createElement('iframe');
                htmlIframe.src = src;
                htmlIframe.title = title;
                htmlIframe.style.width = width * 2000 + "px";
                htmlIframe.style.height = height * 1500 + "px";
                htmlIframe.style.border = 'none';

                const cssObject = new THREE.CSS3DObject(htmlIframe);
                cssObject.position.set(x, y, z);
                scene.add(cssObject);
                iframeObjects.push(cssObject);

                updateIframeList();
                transformControls.attach(cssObject);
                scene.add(transformControls);

                htmlIframe.onload = function() {
                        updateIframePosition(htmlIframe); 
                };
                window.addEventListener('resize', () => updateIframePosition(htmlIframe, x, y, z), { passive: true });
            }

            function updateIframeList() {
                const iframeList = document.getElementById('iframe-list');
                    iframeList.innerHTML = '';
                    iframeObjects.forEach((iframe, index) => {
                    const iframeOption = document.createElement('option');
                    iframeOption.value = index;
                    iframeOption.text = `Iframe ${index + 1}`; // <-- Fixed the template literal here
                    iframeOption.addEventListener('click', () => selectIframe(index));
                    iframeList.appendChild(iframeOption);
                });
            }

            function nextIframe() {
                if (currentIframeIndex < iframeObjects.length - 1) {
                    currentIframeIndex++;
                    selectIframe(currentIframeIndex);
                } else {
                    currentIframeIndex = 0;
                    selectIframe(currentIframeIndex);
                }
            }

            function prevIframe() {
                if (currentIframeIndex > 0) {
                    currentIframeIndex--;
                    selectIframe(currentIframeIndex);
                } else {
                    currentIframeIndex = iframeObjects.length - 1;
                    selectIframe(currentIframeIndex);
                }
            }

            function selectIframe(index) {
                if (iframeObjects[index]) {
                    transformControls.attach(iframeObjects[index]);
                    selectedIframe = iframeObjects[index];
                    selectedIframe.style.border = "1px solid hotpink";
                }
            }

            function deleteSelectedIframe() {
                if (selectedIframe) {
                    scene.remove(selectedIframe);
                    const index = iframeObjects.indexOf(selectedIframe);
                    if (index !== -1) {
                        iframeObjects.splice(index, 1);
                    }
                    selectedIframe = null;
                    currentIframeIndex = -1;
                    updateIframeList();
                }
            }

            function updateIframeURL() {
                const newURL = document.getElementById('iframe-url').value;
                if (selectedIframe && newURL) {
                    selectedIframe.element.src = newURL;
                }
            }

            function toggleMode() {
                if (isFlyMode) {
                    flyControls.enabled = false;
                    orbitControls.enabled = true;
                    document.getElementById('toggle-mode').textContent = 'Switch to Fly Mode';
                } else {
                    orbitControls.enabled = false;
                    flyControls.enabled = true;
                    document.getElementById('toggle-mode').textContent = 'Switch to Orbit Mode';
                }
                isFlyMode = !isFlyMode;
            }

            function toggleGrid() {
                gridHelper.visible = !gridVisible;
                gridVisible = !gridVisible;
            }

        // Starfield Animation
        let stars = [];
        function starfieldAnimation() {
            const starfieldCanvas = document.getElementById('starfield');
            const ctx = starfieldCanvas.getContext('2d');

            starfieldCanvas.width = window.innerWidth;
            starfieldCanvas.height = window.innerHeight;

            let starCount = 1000;

            for (let i = 0; i < starCount; i++) {
                stars.push({
                    x: Math.random() * starfieldCanvas.width,
                    y: Math.random() * starfieldCanvas.height,
                    z: Math.random() * starfieldCanvas.width,
                });
            }

            function drawStarfield() {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, starfieldCanvas.width, starfieldCanvas.height);

            ctx.fillStyle = '#FFF';
            for (let i = 0; i < starCount; i++) {
                const star = stars[i];
                star.z -= starSpeed;
                if (star.z <= 0) {
                    star.x = Math.random() * starfieldCanvas.width;
                    star.y = Math.random() * starfieldCanvas.height;
                    star.z = starfieldCanvas.width;
                }
                const sx = (star.x - starfieldCanvas.width / 2) * (starfieldCanvas.width / star.z) + starfieldCanvas.width / 2;
                const sy = (star.y - starfieldCanvas.height / 2) * (starfieldCanvas.width / star.z) + starfieldCanvas.height / 2;
                const size = (starfieldCanvas.width / star.z) * 0.5;
                ctx.fillRect(sx, sy, size, size);
            }
            requestAnimationFrame(drawStarfield);
        }

        drawStarfield();
    }

        starfieldAnimation();

            function onWindowResize() {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                webGLRenderer.setSize(window.innerWidth, window.innerHeight);
                css3DRenderer.setSize(window.innerWidth, window.innerHeight);
            }

            function render() {
                webGLRenderer.render(scene, camera);
                css3DRenderer.render(scene, camera);
            }

            function animate() {
                requestAnimationFrame(animate);

                if (isFlyMode) {
                    const delta = clock.getDelta();
                    flyControls.update(delta);
                } else {
                    orbitControls.update();
                }

                webGLRenderer.render(scene, camera);
                css3DRenderer.render(scene, camera);
            }

            function updateIframeList() {
                const iframeList = document.getElementById('iframe-list');
                iframeList.innerHTML = '';
                iframeObjects.forEach((iframe, index) => {
                    const iframeItem = document.createElement('div');
                    iframeItem.textContent = `Iframe ${index + 1}: ${iframe.element.src}`;
                    iframeItem.addEventListener('click', () => selectIframe(index));
                    iframeList.appendChild(iframeItem);
                });
            }

            init();
        }
        //nyx4d@proton.me
