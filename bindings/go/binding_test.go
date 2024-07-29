package tree_sitter_ned_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-ned"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_ned.Language())
	if language == nil {
		t.Errorf("Error loading Ned grammar")
	}
}
