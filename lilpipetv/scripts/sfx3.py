import numpy as np, wave, sys
SR=44100; DUR=27.5; N=int(SR*DUR)
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

def pluck(t,f,g=0.35):
    put(t, tone(f,f,0.18)*env(int(SR*0.18),0.002,0.05),g)
def scratchrec(t):
    n=noise(0.35); k=np.linspace(0.6,0.05,len(n)); y=np.zeros_like(n); acc=0.
    for i,v in enumerate(n): acc+=k[i]*(v-acc); y[i]=acc
    put(t, y*env(len(n),0.002,0.12),1.0); put(t, tone(900,120,0.3)*env(int(SR*0.3),0.002,0.1),0.5)
def click(t):
    n=noise(0.03); put(t, n*env(len(n),0.0005,0.006),0.9); put(t, tone(2400,1800,0.04)*env(int(SR*0.04),0.001,0.01),0.4)
def fallwhistle(t,sec):
    put(t, tone(1400,300,sec)*np.linspace(0.6,1,int(SR*sec)),0.35)
def splash(t):
    n=noise(0.8); put(t, lp(n,0.35)*env(len(n),0.003,0.25),1.0); put(t, tone(120,50,0.3)*env(int(SR*0.3),0.002,0.1),0.7)
for t in [1.6,4.0,5.6,7.6,9.0,11.0,13.4,15.2,17.4,18.4,19.8,21.2,23.4]: whoosh(t-0.12,0.3)
for k in range(9): step(0.35+k*0.25)
for k in range(3): step(3.15+k*0.22)
for k in range(3): step(4.05+k*0.22)
put(4.8, tone(300,520,0.25)*env(int(SR*0.25),0.004,0.1),0.4); sparkle(4.85)
pluck(5.78,880); pluck(5.86,1320)
for k in range(8): pluck(7.65+k*0.15, 660 if k%2 else 880, 0.3)
scratchrec(9.55); crunch(9.6)
pop(6.22,500); pop(11.62,700); pop(17.32,600); pop(23.52,500)
for k in range(16): step(11.0+k*0.13)
pop(11.75,900); sparkle(11.75)
for k in range(8): step(12.1+k*0.13)
ding(15.0)
for k in range(4): step(15.45+k*0.24)
click(17.66); put(17.7, tone(90,40,0.4)*env(int(SR*0.4),0.002,0.15),0.9)
thunk(19.5); whoosh(19.45,0.3)
fallwhistle(19.72,0.9)
splash(20.62)
for k in range(3): step(21.35+k*0.2)
pop(22.2,800); ding(22.22)
for k in range(6): put(23.6+k*0.35, noise(0.06)*env(int(SR*0.06),0.001,0.02)*0.15,0.5)
write(sys.argv[1],out)
