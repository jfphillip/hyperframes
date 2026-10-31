import numpy as np, wave, sys
SR=44100; DUR=19.0; N=int(SR*DUR)
rng=np.random.default_rng(7)
def write(path,x):
    x=x/ max(1e-9,np.abs(x).max())*0.89
    st=np.stack([x,x],1)
    with wave.open(path,'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
        w.writeframes((st*32767).astype(np.int16).tobytes())
def env(n,a=0.003,d=0.15):
    t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t/d)
def lp(x,k):  # one-pole lowpass
    y=np.zeros_like(x); acc=0.
    for i,v in enumerate(x): acc+=k*(v-acc); y[i]=acc
    return y
def noise(sec): return rng.uniform(-1,1,int(SR*sec))
def tone(f0,f1,sec,shape='sine'):
    n=int(SR*sec); f=np.linspace(f0,f1,n); ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph) if shape=='sine' else np.sign(np.sin(ph))*0.5
out=np.zeros(N)
def put(t,x,g=1.0):
    i=int(t*SR); x=x[:N-i]; out[i:i+len(x)]+=x*g
def scratch(t,hits=4):  # pickaxe ticks while cracking
    for k in range(hits):
        n=noise(0.06); put(t+k*0.15, lp(n,0.5)*env(len(n),0.001,0.02),0.5)
def crunch(t):
    n=noise(0.35); put(t, lp(n,0.25)*env(len(n),0.002,0.08),1.0)
    put(t, tone(180,60,0.25)*env(int(SR*0.25),0.002,0.06),0.8)
def thunk(t):
    put(t, tone(150,70,0.2)*env(int(SR*0.2),0.002,0.05),0.9)
    n=noise(0.1); put(t, lp(n,0.15)*env(len(n),0.001,0.03),0.6)
def pop(t,f=600):
    put(t, tone(f,f*2.2,0.12)*env(int(SR*0.12),0.002,0.04),0.5)
def whoosh(t,sec=0.6):
    n=noise(sec); e=np.sin(np.linspace(0,np.pi,len(n)))**2
    k=np.linspace(0.05,0.4,len(n)); y=np.zeros_like(n); acc=0.
    for i,v in enumerate(n): acc+=k[i]*(v-acc); y[i]=acc
    put(t,y*e,0.7)
def ding(t):
    for f,g in [(1318,0.4),(1976,0.3),(2637,0.2)]:
        put(t, tone(f,f,1.2)*env(int(SR*1.2),0.002,0.35),g)
def step(t):
    n=noise(0.05); put(t, lp(n,0.2)*env(len(n),0.001,0.015),0.35)
def sparkle(t):
    for k,f in enumerate([1568,2093,2637,3136,4186]):
        put(t+k*0.07, tone(f,f,0.4)*env(int(SR*0.4),0.002,0.12),0.25)
# text pops on each card
for t in [2.62,5.82,9.02,12.42,15.5]: pop(t)
scratch(2.9); crunch(3.5); scratch(4.0); crunch(4.6)
whoosh(6.25,0.45); thunk(6.8); whoosh(7.25,0.45); thunk(7.8)
whoosh(9.9,0.7); thunk(10.6); ding(10.65)
for k in range(9): step(12.45+k*0.24)
whoosh(14.2,0.8)
put(15.8, tone(300,520,0.25)*env(int(SR*0.25),0.004,0.1),0.4)  # chest creak-ish
sparkle(16.2); ding(16.25)
write(sys.argv[1],out)
# music: soft square-wave chiptune, C major pentatonic, 120 bpm
m=np.zeros(N); beat=0.5
mel=[0,2,4,7,9,7,4,2, 0,4,7,9,12,9,7,4]
bass=[0,0,-5,-5,-3,-3,-5,-5]
f=lambda s:261.63*2**(s/12)
for i in range(int(DUR/beat*2)):
    t=i*beat/2; s=mel[i%len(mel)]
    n=int(SR*0.22); x=tone(f(s),f(s),0.22,'sq')*env(n,0.004,0.08)
    j=int(t*SR); x=x[:N-j]; m[j:j+len(x)]+=x*0.35
for i in range(int(DUR/beat)):
    t=i*beat; s=bass[i%len(bass)]-12
    n=int(SR*0.4); x=tone(f(s),f(s),0.4)*env(n,0.005,0.2)
    j=int(t*SR); x=x[:N-j]; m[j:j+len(x)]+=x*0.6
write(sys.argv[2],lp(m,0.35))
