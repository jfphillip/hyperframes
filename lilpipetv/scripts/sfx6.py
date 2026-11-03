import numpy as np, wave, sys
SR=44100; DUR=59.6; N=int(SR*DUR)
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

def siren(t,sec):
    n=int(SR*sec); tt=np.arange(n)/SR
    f=np.where((tt*4).astype(int)%2==0,880,660)
    put(t,np.sin(2*np.pi*np.cumsum(f)/SR)*0.25,0.5)
def thwip(t):
    n=noise(0.18); k=np.linspace(0.05,0.8,len(n)); y=np.zeros_like(n); acc=0.
    for i,v in enumerate(n): acc+=k[i]*(v-acc); y[i]=acc
    put(t,y*env(len(n),0.002,0.06),0.9)
def heal(t):
    for k,f in enumerate([523,659,784,1047]): put(t+k*0.09, tone(f,f,0.25)*env(int(SR*0.25),0.002,0.1),0.3)
def groan(t):
    n=int(SR*0.8); tt=np.arange(n)/SR
    put(t,np.sin(2*np.pi*(95+15*np.sin(2*np.pi*5*tt))*tt)*np.sin(np.linspace(0,np.pi,n))*0.6,0.6)
def drone(t,sec):
    n=int(SR*sec); tt=np.arange(n)/SR
    put(t,(np.sin(2*np.pi*55*tt)+0.5*np.sin(2*np.pi*82.5*tt))*np.sin(np.linspace(0,np.pi,n))*0.5,0.6)
def hiss(t,sec):
    n=noise(sec); put(t, n*np.linspace(0.1,1,len(n))*0.4,0.5)
def creak(t,sec):
    n=int(SR*sec); tt=np.arange(n)/SR
    put(t,np.sign(np.sin(2*np.pi*(60+40*tt/sec)*tt))*0.15*np.sin(np.linspace(0,np.pi,n)),0.5)

def tick(t,g=0.5):
    n=noise(0.02); put(t, lp(n,0.6)*env(len(n),0.0005,0.004),g); put(t, tone(3200,2800,0.02)*env(int(SR*0.02),0.0005,0.004),g*0.5)
def knock(t):
    put(t, tone(180,90,0.12)*env(int(SR*0.12),0.001,0.03),0.9); n=noise(0.05); put(t, lp(n,0.2)*env(len(n),0.001,0.015),0.6)
def womp(t):
    for k,f in enumerate([392,370,349,262]): put(t+k*0.22, (tone(f,f*0.97,0.3 if k<3 else 0.7)*env(int(SR*(0.3 if k<3 else 0.7)),0.01,0.2)),0.25)
def scratch(t):
    n=noise(0.3); k=np.linspace(0.6,0.05,len(n)); y=np.zeros_like(n); acc=0.
    for i,v in enumerate(n): acc+=k[i]*(v-acc); y[i]=acc
    put(t, y*env(len(n),0.002,0.1),0.9); put(t, tone(900,140,0.25)*env(int(SR*0.25),0.002,0.08),0.4)
def chime(t,f=880):
    for k,m in enumerate([1,1.5,2]): put(t, tone(f*m,f*m,0.8)*env(int(SR*0.8),0.002,0.3),0.18/(k+1))
# hook: slow ticks + drone
drone(0.0,9.2)
for k in range(8): tick(0.6+k*1.0,0.45)
put(7.1, tone(70,40,1.2)*env(int(SR*1.2),0.01,0.5),0.9)
whoosh(9.1,0.3)
chime(11.7,880); chime(12.5,880); chime(13.3,740)
put(14.95, tone(300,600,0.9)*np.linspace(0,1,int(SR*0.9)),0.15)
scratch(16.0); womp(16.25)
for t in [16.3,19.4,20.6,23.3,25.4,27.71,30.8,32.7,34.3,35.2,38.4,40.5,44.1,47.2,49.6,50.6,52.0,55.0,56.16]: whoosh(t-0.12,0.22)
for i in range(15): pop(19.55+i*0.05, 600+i*30)
put(21.6, tone(100,300,1.6)*np.linspace(0,1,int(SR*1.6)),0.35); drone(21.9,5.8)
boom(24.09,0.6)
for k in range(5): tick(24.3+k*0.8,0.5)
boom(25.51,0.9)
for i,t in enumerate([29.0,29.3,29.6,30.13,31.9,32.15,32.4,33.65,33.9,34.17]): put(t, lp(noise(0.4),0.25)*env(int(SR*0.4),0.01,0.12),0.5); pluck(t,220-i*8,0.2)
pop(34.5,700)
for k in range(4): step(35.3+k*0.35)
for t in [37.45,37.65,37.85]: knock(t)
creak(38.05,0.3)
t=38.4; gap=0.95
while t<48.1:
    tick(t,0.55); t+=gap; gap=max(0.17,gap*0.9)
creak(48.2,0.5)
boom(48.9,1.0)
put(49.6, tone(220,220,1.5)*env(int(SR*1.5),0.05,0.6),0.25)
chime(52.54,660); sparkle(52.56)
tick(53.38,1.0); put(53.38, tone(3000,2500,0.6)*env(int(SR*0.6),0.001,0.25),0.15)
boom(55.0,0.5); drone(56.16,3.4); pop(56.2,400)
write(sys.argv[1],out)
