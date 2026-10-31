import numpy as np, wave, sys
SR=44100; DUR=28.0; N=int(SR*DUR)
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
def click(t):
    n=noise(0.03); put(t, n*env(len(n),0.0005,0.006),0.9); put(t, tone(2400,1800,0.04)*env(int(SR*0.04),0.001,0.01),0.4)
def boom(t,g=1.0):
    put(t, tone(110,35,0.7)*env(int(SR*0.7),0.002,0.25),g); n=noise(0.25); put(t, lp(n,0.3)*env(len(n),0.001,0.06),0.6*g)
def splash(t):
    n=noise(0.8); put(t, lp(n,0.35)*env(len(n),0.003,0.25),1.0); put(t, tone(120,50,0.3)*env(int(SR*0.3),0.002,0.1),0.7)
def rewind(t,sec):
    n=int(SR*sec); tt=np.arange(n)/SR
    f=1800+900*np.sin(2*np.pi*14*tt); ph=2*np.pi*np.cumsum(f)/SR
    x=np.sin(ph)*0.35+lp(noise(sec),0.6)*0.25
    put(t, x*np.sin(np.linspace(0,np.pi,n))**0.5,0.8)
def zap(t):
    n=int(SR*0.45); tt=np.arange(n)/SR
    x=np.sign(np.sin(2*np.pi*np.cumsum(np.linspace(200,1400,n))/SR))*0.3*np.exp(-tt/0.25)
    put(t,x,0.6); put(t,lp(noise(0.3),0.7)*env(int(SR*0.3),0.001,0.08),0.3)
def squish(t):
    n=int(SR*0.4); tt=np.arange(n)/SR
    put(t, np.sin(2*np.pi*(90+40*np.sin(2*np.pi*12*tt))*tt)*np.exp(-tt/0.15),0.7)
boom(0.0,0.9); boom(1.14,1.0); crunch(1.14)
rewind(1.6,0.95)
whoosh(2.42,0.25); pop(2.6,500); pop(3.76,900)
boom(4.68,0.5)
for i in range(6): crunch(5.5+i*0.25)
ding(7.0)
boom(8.56,0.5); crunch(9.7); whoosh(9.6,0.45); boom(10.06,1.0)
squish(10.52); pop(12.3,700); whoosh(13.0,0.3); thunk(13.3); click(13.32)
boom(14.96,0.5)
for i in range(10): pluck(16.12+i*0.12, 500+i*60, 0.25)
thunk(17.7); zap(18.25)
for k in range(6): step(19.6+k*0.13)
click(21.95); thunk(22.35); click(22.37)
put(22.75, tone(1400,250,1.2)*np.linspace(0.6,1,int(SR*1.2)),0.35)
boom(22.86,0.8)
splash(23.91)
pop(24.4,500); sparkle(24.45)
write(sys.argv[1],out)
