package main

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"sync"
	"syscall"
)

type Proc struct {
	Name string
	Cmd  *exec.Cmd
}

func prefixedCopy(prefix string, r *bufio.Scanner, wg *sync.WaitGroup) {
	defer wg.Done()
	for r.Scan() {
		fmt.Printf("%s %s\n", prefix, r.Text())
	}
}

func startProc(name, dir, exe string, args ...string) (*Proc, error) {
	cmd := exec.Command(exe, args...)
	cmd.Dir = dir
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, err
	}
	if err := cmd.Start(); err != nil {
		return nil, err
	}
	var wg sync.WaitGroup
	wg.Add(2)
	go prefixedCopy(fmt.Sprintf("[%s]", name), bufio.NewScanner(stdout), &wg)
	go prefixedCopy(fmt.Sprintf("[%s]", name), bufio.NewScanner(stderr), &wg)
	go func() { wg.Wait() }()
	return &Proc{Name: name, Cmd: cmd}, nil
}

func killProc(p *Proc) {
	if p == nil || p.Cmd == nil || p.Cmd.Process == nil {
		return
	}
	_ = p.Cmd.Process.Signal(syscall.SIGINT)
	_ = p.Cmd.Process.Kill()
}

func main() {
	root, _ := os.Getwd()
	clientDir := filepath.Join(root, "client")

	server, err := startProc("server", root, "go", "run", "cmd/server/main.go")
	if err != nil {
		fmt.Println("[dev] server start error:", err)
		return
	}

	clientExe := "npm.cmd"
	client, err := startProc("client", clientDir, clientExe, "run", "dev")
	if err != nil {
		fmt.Println("[dev] client start error:", err)
		killProc(server)
		return
	}

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, os.Interrupt, syscall.SIGTERM)
	<-sig

	killProc(client)
	killProc(server)
}
