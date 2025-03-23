import cv2

def count_cameras():
    """
    检测系统中可用的摄像头数量
    """
    print("开始检测系统摄像头...")
    
    # 尝试打开索引从0开始的摄像头，直到失败
    max_to_test = 10  # 最多测试10个索引
    available_cameras = []
    
    for i in range(max_to_test):
        cap = cv2.VideoCapture(i)
        if cap is None or not cap.isOpened():
            print(f"- 索引 {i}: 不可用")
        else:
            print(f"- 索引 {i}: 可用 - 分辨率: {int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))}x{int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))}")
            available_cameras.append(i)
        
        # 一定要记得释放摄像头资源
        if cap is not None:
            cap.release()
    
    print(f"\n总共检测到 {len(available_cameras)} 个可用摄像头")
    if available_cameras:
        print(f"可用摄像头索引: {available_cameras}")
    else:
        print("没有检测到任何摄像头")
    
    return available_cameras

if __name__ == "__main__":
    count_cameras() 