import os;
import warnings

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  
os.environ['CUDA_VISIBLE_DEVICES'] = '-1' 
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0' 
os.environ['TF_DISABLE_MKL'] = '1'  
os.environ['KMP_WARNINGS'] = '0'  
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)

import eel;
from engine.features import *
from engine.command import greeting
from engine.cv_analyzer.cv_command import analyze_resume
from engine.img_generator.generative_fill import generative_fill
from engine.img_generator.erase_foreground import erase_foreground
from engine.img_generator.hd_image_generation import generate_hd_image
from engine.img_generator.lifestyle_shot import *
from engine.img_generator.packshot import *
from engine.img_generator.prompt_enhancement import *
from engine.img_generator.shadow import *
import time
import tensorflow as tf

tf.get_logger().setLevel('ERROR')

greeting()
time.sleep(1)
eel.init('www')
eel.start('index.html', mode='chrome', host='localhost', port=8000, block=True)
