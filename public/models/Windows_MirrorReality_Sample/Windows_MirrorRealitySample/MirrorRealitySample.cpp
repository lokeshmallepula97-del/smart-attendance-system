// MirrorRealitySample.cpp : Defines the entry point for the application.
//

#include "stdafx.h"
#include <math.h>
#include "MirrorRealitySDK.h"
#include "MirrorRealitySample.h"

#define MAX_LOADSTRING 100

HINSTANCE hInst;
TCHAR szTitle[MAX_LOADSTRING];
TCHAR szWindowClass[MAX_LOADSTRING];

HWND hDlgForm;
HDC hDC;
HGLRC hRC;

RECT rcOwner;
RECT wPos;
int ScreenX, ScreenY;

bool Exit;

#define MAX_FACES 8

const int mask_count = 45;
const char * masks[mask_count] = {
    "img\\leopard",
    "img\\corpse_bride",
    "img\\mermaid",
    "img\\piercing",
    "img\\tattoo",
    "img\\piercing2",
    "img\\scheherazade",
    "img\\crow",
    "img\\popart",
    "img\\snowqueen1",
    "img\\snake",
    "img\\hannibal",
    "img\\carnival1",
    "img\\young",
    "img\\bat",
    "img\\carnival3",
    "img\\terminator",
    "img\\wolf",
    "img\\zombie",
    "img\\old_man",
    "img\\butterfly",
    "img\\latino",
    "img\\mime",
    "img\\scaryface",
    "img\\piercing1",
    "img\\indian_piercing",
    "img\\avatar",
    "img\\cloud",
    "img\\beard_man",
    "img\\queen_card",
    "img\\chewbacca",
    "img\\cheshire_cat",
    "img\\elf",
    "img\\freddy_krueger",
    "img\\frozen_elsa",
    "img\\frozen_olaf",
    "img\\gorgon",
    "img\\matryoshka_doll",
    "img\\pilot",
    "img\\santa",
    "img\\santa_white",
    "img\\saw",
    "img\\viking",
    "img\\white_walker",
    "img\\yoda",
};
int shifts[mask_count] = {
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_IN,  // young3
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_OUT, // zombie2
    MR_SHIFT_TYPE_OUT, // old_new
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
    MR_SHIFT_TYPE_NO,
};

int mask_number = 0;

GLuint maskTexture1;
GLuint maskTexture2;
int isMaskTexture1Created = 0;
int isMaskTexture2Created = 0;
MR_MaskFeatures maskCoords;


// Forward declarations of functions included in this code module:
BOOL				InitInstance(HINSTANCE, int);
INT_PTR CALLBACK	CamFaceInterface(HWND, UINT, WPARAM, LPARAM);


bool FileExists(LPCSTR fname)
{
  return ::GetFileAttributesA(fname) != DWORD(-1);
}

GLvoid InitGL()
{
	glClearColor(0.0f, 0.0f, 0.0f, 0.0f);
	glClearDepth(1.0);
	glDepthFunc(GL_LESS);
	glEnable(GL_DEPTH_TEST);
	glMatrixMode(GL_PROJECTION);
	glLoadIdentity();
	glMatrixMode(GL_MODELVIEW);
}

void LoadMask()
{
	HImage img;
	HImage normal_img;

	if (isMaskTexture1Created) {
		glDeleteTextures(1, &maskTexture1);
	}
	if (isMaskTexture2Created) {
		glDeleteTextures(1, &maskTexture2);
	}
	isMaskTexture1Created = 0;
	isMaskTexture2Created = 0;

	const char * effectname = masks[mask_number];
	
	char grdname[1024];
	strcpy_s(grdname, 1024, effectname);
	strcpy_s(grdname + strlen(grdname), 1024 - strlen(grdname), ".grd");
	char topname[1024];
	strcpy_s(topname, 1024, effectname);
	strcpy_s(topname + strlen(topname), 1024 - strlen(topname), "_normal.png");
	char maskname[1024];
	strcpy_s(maskname, 1024, effectname);
	strcpy_s(maskname + strlen(maskname), 1024 - strlen(maskname), ".png");
	
	if (FSDK_LoadImageFromFileWithAlpha(&img, maskname) != FSDKE_OK) {
		FSDK_CreateEmptyImage(&img);
	}
	if (FSDK_LoadImageFromFileWithAlpha(&normal_img, topname) != FSDKE_OK) {
		FSDK_CreateEmptyImage(&normal_img);
	}

	int result = MR_LoadMaskCoordsFromFile(grdname, maskCoords);
	if (result == FSDKE_OK) {
		glGenTextures(1, &maskTexture1);
		glGenTextures(1, &maskTexture2);
		MR_LoadMask(img, normal_img, maskTexture1, maskTexture2, &isMaskTexture1Created, &isMaskTexture2Created);
	}

	FSDK_FreeImage(img);
	FSDK_FreeImage(normal_img);
}

void LoadNextMask()
{
	mask_number = (mask_number+1) % mask_count;
    LoadMask();
}

int APIENTRY _tWinMain(HINSTANCE hInstance,
                     HINSTANCE hPrevInstance,
                     LPTSTR    lpCmdLine,
                     int       nCmdShow)
{
	UNREFERENCED_PARAMETER(hPrevInstance);
	UNREFERENCED_PARAMETER(lpCmdLine);

	LoadString(hInstance, IDS_APP_TITLE, szTitle, MAX_LOADSTRING);
	LoadString(hInstance, IDC_MIRRORREALITY, szWindowClass, MAX_LOADSTRING);

	wchar_t filename[_MAX_PATH];
    GetModuleFileNameW(NULL, filename, _MAX_PATH);
	int i, sl;
	sl=-1;
	#if defined( _WIN32 ) || defined ( _WIN64 )
		wchar_t slash=L'\\';
	#else
		wchar_t slash=L'/';
	#endif
	for (i=0; filename[i]!=L'\0';i++)
	{
		if (filename[i]==slash)
			sl=i;
	}
	filename[sl+1]=L'\0';

	SetCurrentDirectoryW(filename);

	// Perform application initialization:
	return InitInstance(hInstance, nCmdShow);
}


void ReSizeGLScene(GLsizei Width, GLsizei Height) {
	if (Height == 0) Height=1;
	glViewport(0, 0, Width, Height);
	glMatrixMode(GL_PROJECTION);
	glLoadIdentity();
	glMatrixMode(GL_MODELVIEW);
}

void LoadGLTextures(int w, int h, GLuint * texture, HImage image) { 
	int Width, Height;
	FSDK_GetImageWidth(image, &Width);
	FSDK_GetImageHeight(image, &Height);

	unsigned char * data;
	data = new unsigned char[4 * Width * Height];
	FSDK_SaveImageToBuffer(image, data, FSDK_IMAGE_COLOR_32BIT);

	for (int x = 0; x < 4 * Width; x++)
		for (int y = 0; y < Height / 2; y++) {
			unsigned char t;
			t = data[x + y * 4 * Width];
			data[x + y * Width * 4] = data[x + (Height - y - 1) * Width * 4];
			data[x + (Height - y - 1) * Width * 4] = t;
		}

	glGenTextures(1, texture);
    glBindTexture(GL_TEXTURE_2D, *texture);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, Width, Height, 0, GL_RGBA, GL_UNSIGNED_BYTE, data);
	delete [] data;
}

BOOL InitInstance(HINSTANCE hInstance, int nCmdShow)
{
	hInst = hInstance; // Store instance handle in our global variable

	int res = MR_ActivateLibrary("");
	if (FSDKE_OK != res){
		MessageBox(NULL, L"MirrorReality SDK is not activated.", L"Error", MB_ICONERROR | MB_OK);
		return FALSE;
	}
	FSDK_Initialize("");
	FSDK_InitializeCapturing();

	int CameraCount = 0;
    wchar_t ** CameraList;
    FSDK_GetCameraList(&CameraList, &CameraCount);
	if (0 == CameraCount) {
		MessageBox(0, L"Please attach a camera", L"Error", MB_ICONERROR | MB_OK);
        return FALSE;
    }

	int VideoFormatCount = 0;
	FSDK_VideoFormatInfo * VideoFormatList;
	FSDK_GetVideoFormatList(CameraList[0], &VideoFormatList, &VideoFormatCount);
	
	FSDK_VideoFormatInfo videoFormat = VideoFormatList[0];
	FSDK_SetVideoFormat(CameraList[0], videoFormat);
	ScreenX = videoFormat.Width;
	ScreenY = videoFormat.Height;

	int handle;
	if (FSDKE_OK != FSDK_OpenVideoCamera(CameraList[0], &handle)) {
		MessageBox(0, L"Error opening the camera", L"Error", MB_ICONERROR | MB_OK);
        return FALSE;
	}

	HWND hOwner = GetDesktopWindow(); 
	GetWindowRect(hOwner, &rcOwner);

	hDlgForm = CreateDialog(hInst, MAKEINTRESOURCE(IDD_CAMFACESDK), NULL, CamFaceInterface);
	HICON hIcon1 = LoadIcon(GetModuleHandle(NULL), MAKEINTRESOURCE(IDI_MIRRORREALITY));
	SendMessage(hDlgForm, WM_SETICON, (WPARAM)ICON_BIG, (LPARAM)hIcon1);
	ShowWindow(hDlgForm, SW_SHOW);
	UpdateWindow(hDlgForm);

	LoadMask();

	HTracker tracker;
	FSDK_CreateTracker(&tracker);
	int err = 0;
	FSDK_SetTrackerMultipleParameters(tracker, "RecognizeFaces=false; DetectFacialFeatures=true; HandleArbitraryRotations=false; DetermineFaceRotationAngle=false; InternalResizeWidth=100; FaceDetectionThreshold=5;", &err);

	Exit = false;
	while (!Exit) {
		HImage image;

		FSDK_GrabFrame(handle, &image);

		int detected = 0;
		
		long long IDs[256];
		long long count = 0;
		FSDK_FeedFrame(tracker, 0, image, &count, IDs, sizeof(IDs));
		int ww, hh;
		FSDK_GetImageWidth(image, &ww);
		FSDK_GetImageHeight(image, &hh);

		detected = (int)count;
		FSDK_Features f[MR_MAX_FACES];
		for (int facenum = 0; facenum < count; facenum++) {
			FSDK_GetTrackerFacialFeatures(tracker, 0, IDs[facenum], &(f[facenum]));
			for (int i=0; i<FEATURES_NUMBER; ++i) {
				f[facenum][i].x = f[facenum][i].x * ScreenX/ww;
				f[facenum][i].y = f[facenum][i].y * ScreenY/hh;
			}
		}

		ReSizeGLScene(ScreenX, ScreenY);

		GLuint texture;
		LoadGLTextures(ScreenX, ScreenY, &texture, image);

		MR_DrawGLScene(texture, detected, f, 0, shifts[mask_number], maskTexture1, maskTexture2, maskCoords, isMaskTexture1Created, isMaskTexture2Created, ScreenX, ScreenY);
		
		SwapBuffers(hDC);
		
		glDeleteTextures(1, &texture);

		FSDK_FreeImage(image);

		MSG msg;
		if (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
			if (!IsWindow(hDlgForm) || !IsDialogMessage(hDlgForm, &msg)) {
				TranslateMessage(&msg);
				DispatchMessage(&msg); 
			}
		}
	}

	FSDK_FreeTracker(tracker);

	if (FSDK_CloseVideoCamera(handle) < 0) {
		MessageBox(0, TEXT("Error closing camera."), TEXT("Error"), MB_ICONERROR | MB_OK);
	}

	FSDK_FreeVideoFormatList(VideoFormatList);
	FSDK_FreeCameraList(CameraList, CameraCount);

	FSDK_FinalizeCapturing();
	FSDK_Finalize();

	return TRUE;
}



INT_PTR CALLBACK CamFaceInterface(HWND hDlg, UINT message, WPARAM wParam, LPARAM lParam)
{
	UNREFERENCED_PARAMETER(lParam);

	GLuint	PixelFormat;
	static	PIXELFORMATDESCRIPTOR pfd=
	{
		sizeof(PIXELFORMATDESCRIPTOR),
		1,
		PFD_DRAW_TO_WINDOW |
		PFD_SUPPORT_OPENGL |
		PFD_DOUBLEBUFFER,
		PFD_TYPE_RGBA,
		16,
		0, 0, 0, 0, 0, 0,
		0,
		0,
		0,
		0, 0, 0, 0,
		16,  
		0,
		0,
		PFD_MAIN_PLANE,
		0,
		0, 0, 0
	};

	float newScreenX, newScreenY;
	switch (message)
	{

	case WM_INITDIALOG:
		hDC = GetDC(hDlg);
		PixelFormat = ChoosePixelFormat(hDC, &pfd);
		if (!PixelFormat)
		{
			MessageBox(0,L"Can't Find A Suitable PixelFormat.",L"Error",MB_OK|MB_ICONERROR);
			PostQuitMessage(0);
			break;
		}
		if (!SetPixelFormat(hDC,PixelFormat,&pfd))
		{
			MessageBox(0,L"Can't Set The PixelFormat.",L"Error",MB_OK|MB_ICONERROR);
			PostQuitMessage(0);
			break;
		}
		hRC = wglCreateContext(hDC);
		if(!hRC)
		{
			MessageBox(0,L"Can't Create A GL Rendering Context.",L"Error",MB_OK|MB_ICONERROR);
			PostQuitMessage(0);
			break;
		}
		if(!wglMakeCurrent(hDC, hRC))
		{
			MessageBox(0,L"Can't activate GLRC.",L"Error",MB_OK|MB_ICONERROR);
			PostQuitMessage(0);
			break;
		}
		InitGL();

		newScreenX = (rcOwner.left + rcOwner.right)/2.0f;
		newScreenY = (rcOwner.top + rcOwner.bottom)/2.0f;
		if (newScreenX/ScreenX <= newScreenY/ScreenY) {
			ScreenY = (int)(ScreenY*newScreenX/ScreenX);
			ScreenX = (int)newScreenX;
		} else {
			ScreenX = (int)(ScreenX*newScreenY/ScreenY);
			ScreenY = (int)newScreenY;
		}

		SetWindowLong(hDlg, GWL_STYLE, WS_CAPTION | WS_SYSMENU | WS_MINIMIZEBOX);
		SetWindowPos(hDlg, HWND_TOP, (rcOwner.left + rcOwner.right)/4, (rcOwner.top + rcOwner.bottom)/4,
			ScreenX, ScreenY + 25 /*For help message*/, NULL);
		GetClientRect(hDlg, &wPos);

	return (INT_PTR)TRUE;


	case WM_SIZE:
		return (INT_PTR)TRUE;

	case WM_RBUTTONDOWN:
		LoadNextMask();
		break;

	case WM_LBUTTONDOWN:
		ReleaseCapture();
		SendMessage (hDlg, WM_NCLBUTTONDOWN, (WPARAM) HTCAPTION, (LPARAM) 0);
		break;

	case WM_COMMAND:
		if (LOWORD(wParam) == IDCANCEL)
		{
			EndDialog(hDlg, LOWORD(wParam));
			Exit = true;
		}
	}

	return (INT_PTR)FALSE;
}

